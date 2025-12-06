'use client';

import WalletConnect from "./components/WalletConnect";
import ContractInteraction from "./components/ContractInteraction";

export default function Home() {
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
      <header className="max-w-6xl mx-auto py-6 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">CallAny Contract</h1>
        <WalletConnect />
      </header>
      
      <main className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-4">Call Any Contract on Any Chain</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect your wallet to interact with any smart contract. Simply provide the contract address, 
            ABI, function name, and arguments to interact with any contract on any supported blockchain.
          </p>
        </div>
        
        <ContractInteraction />
        
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Supported networks include Ethereum, Arbitrum, Polygon, Optimism, BSC, Avalanche, Base, and testnets.</p>
          <p className="mt-2">Always verify contract addresses and interactions before confirming transactions.</p>
        </div>
      </main>
    </div>
  );
}
