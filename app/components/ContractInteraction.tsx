'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletProviders';

export default function ContractInteraction() {
  const { connected, provider, signer, chainId } = useWallet();

  const [contractAddress, setContractAddress] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [functionArgs, setFunctionArgs] = useState('');
  const [functionType, setFunctionType] = useState('call'); // call or send
  const [valueInEth, setValueInEth] = useState('0');
  const [abiInput, setAbiInput] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState('abi'); // 'abi' or 'direct'
  const [rawCalldata, setRawCalldata] = useState('');

  // Handle contract interaction
  const handleContractInteraction = async () => {
    if (!connected || !provider || !signer) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    try {
      if (inputMethod === 'abi') {
        // Parse ABI
        let contractAbi;
        try {
          contractAbi = JSON.parse(abiInput);
        } catch (e) {
          console.error(e)
          throw new Error('Invalid ABI format. Please provide a valid JSON ABI');
        }

        // Create contract instance
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);

        // Parse function arguments
        let parsedArgs = [];
        if (functionArgs.trim()) {
          try {
            // Try to parse as JSON array
            parsedArgs = JSON.parse(functionArgs);
            if (!Array.isArray(parsedArgs)) {
              parsedArgs = [parsedArgs]; // If single value, wrap in array
            }
          } catch (e) {
            // If not valid JSON, split by comma
            console.error(e)
            parsedArgs = functionArgs.split(',').map(arg => arg.trim());
          }
        }

        // Execute transaction or call
        let response;
        if (functionType === 'call') {
          response = await contract[functionName](...parsedArgs);
        } else {
          const tx = await contract[functionName](...parsedArgs, {
            value: ethers.utils.parseEther(valueInEth || '0')
          });
          await tx.wait();
          response = tx.hash;
        }

        // Format response
        if (ethers.BigNumber.isBigNumber(response)) {
          setResult(response.toString());
        } else if (Array.isArray(response)) {
          setResult(JSON.stringify(response));
        } else if (typeof response === 'object' && response !== null) {
          setResult(JSON.stringify(response));
        } else {
          setResult(String(response));
        }
      } else {
        // Direct raw calldata input
        if (!rawCalldata || !rawCalldata.startsWith('0x')) {
          throw new Error('Invalid calldata. Must be a hex string starting with 0x');
        }

        let response;
        if (functionType === 'call') {
          // Static call with raw calldata
          response = await provider.call({
            to: contractAddress,
            data: rawCalldata
          });
        } else {
          // Send transaction with raw calldata
          const tx = await signer.sendTransaction({
            to: contractAddress,
            data: rawCalldata,
            value: ethers.utils.parseEther(valueInEth || '0')
          });
          await tx.wait();
          response = tx.hash;
        }

        setResult(response);
      }
    } catch (err: unknown) {
      console.error('Contract interaction error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred during contract interaction'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6">Contract Interaction</h2>
      
      {!connected && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">
          Please connect your wallet to interact with contracts.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Contract Address</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Function Type</label>
            <select
              value={functionType}
              onChange={(e) => setFunctionType(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="call">Call (Read)</option>
              <option value="send">Send (Write)</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Input Method</label>
            <select
              value={inputMethod}
              onChange={(e) => setInputMethod(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="abi">ABI Encoded</option>
              <option value="direct">Direct Input (Raw Calldata)</option>
            </select>
          </div>
        </div>
        
        {inputMethod === 'abi' ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Contract ABI</label>
              <textarea
                value={abiInput}
                onChange={(e) => setAbiInput(e.target.value)}
                placeholder="[{...}]"
                rows={4}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Function Name</label>
              <input
                type="text"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="balanceOf"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Function Arguments (comma separated or JSON array)
              </label>
              <input
                type="text"
                value={functionArgs}
                onChange={(e) => setFunctionArgs(e.target.value)}
                placeholder='["0x1234...", "100"]'
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Raw Calldata</label>
            <textarea
              value={rawCalldata}
              onChange={(e) => setRawCalldata(e.target.value)}
              placeholder="0x..."
              rows={4}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Enter raw calldata (hex string starting with 0x)</p>
          </div>
        )}

        {functionType === 'send' && (
          <div>
            <label className="block text-sm font-medium mb-1">Value (ETH)</label>
            <input
              type="text"
              value={valueInEth}
              onChange={(e) => setValueInEth(e.target.value)}
              placeholder="0"
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            />
          </div>
        )}

        {connected && chainId && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Connected to chain ID: {chainId} - You can call any contract on this chain
            </p>
          </div>
        )}

        <button
          onClick={handleContractInteraction}
          disabled={loading || !connected || !contractAddress || (inputMethod === 'abi' && !functionName) || (inputMethod === 'direct' && !rawCalldata)}
          className={`w-full py-2 px-4 rounded-md text-white ${
            loading || !connected || !contractAddress || (inputMethod === 'abi' && !functionName) || (inputMethod === 'direct' && !rawCalldata)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Execute'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Result:</h3>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}