'use client';

import { useWallet } from '../context/WalletProviders';
import { useEffect, useState } from 'react';

export default function WalletConnect() {
  const { address, connected, connecting, connect, disconnect, chainId, switchChain } = useWallet();
  const [mounted, setMounted] = useState(false);

  // Common chains for the dropdown
  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 137, name: 'Polygon' },
    { id: 10, name: 'Optimism' },
    { id: 42161, name: 'Arbitrum' },
    { id: 56, name: 'BNB Chain' },
    { id: 43114, name: 'Avalanche' },
    { id: 8453, name: 'Base' },
    // Add more chains as needed
  ];

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format address for display
  const formatAddress = (addr: string | null) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {connected && address ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span className="text-sm">
              Connected: {formatAddress(address)}
            </span>
          </div>
          
          <select 
            value={chainId || 1} 
            onChange={(e) => switchChain(Number(e.target.value))}
            className="py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
          >
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => disconnect()}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          disabled={connecting}
          className={`py-2 px-4 ${
            connecting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black'
          } rounded-lg`}
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}