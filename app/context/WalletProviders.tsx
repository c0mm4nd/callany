'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import { ethers } from 'ethers';

// Create Context to store wallet state and functions
type WalletContextType = {
  provider: ethers.providers.Web3Provider | null;
  address: string | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  signer: ethers.Signer | null;
};

const WalletContext = createContext<WalletContextType>({
  provider: null,
  address: null,
  chainId: null,
  connected: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
  signer: null,
});

export const useWallet = () => useContext(WalletContext);

const injected = injectedModule();
const walletConnect = walletConnectModule({
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3ccc0cbd8b5a0e6a65b68b170f68153c',
});

// Initialize Onboard
const onboard = Onboard({
  wallets: [injected, walletConnect],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    },
    {
      id: '0x89',
      token: 'MATIC',
      label: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
    },
    {
      id: '0xa',
      token: 'ETH',
      label: 'Optimism',
      rpcUrl: 'https://mainnet.optimism.io',
    },
    {
      id: '0xa4b1',
      token: 'ETH',
      label: 'Arbitrum',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
    },
    {
      id: '0x38',
      token: 'BNB',
      label: 'BNB Chain',
      rpcUrl: 'https://bsc-dataseed.binance.org',
    },
    {
      id: '0xa86a',
      token: 'AVAX',
      label: 'Avalanche',
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    },
    {
      id: '0x2105',
      token: 'ETH',
      label: 'Base',
      rpcUrl: 'https://mainnet.base.org',
    },
  ],
  appMetadata: {
    name: 'CallAny',
    icon: 'https://avatars.githubusercontent.com/u/37784886',
    description: 'Call any contract on any chain',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' },
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
    ],
  },
  connect: {
    showSidebar: false,
  },
});

export default function WalletProviders({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Connect wallet function
  const connect = async () => {
    setConnecting(true);
    
    try {
      const wallets = await onboard.connectWallet();
      if (wallets[0]) {
        const { accounts, chains } = wallets[0];
        if (accounts[0]) {
          setAddress(accounts[0].address);
          const chainIdHex = chains[0].id;
          const chainIdNum = parseInt(chainIdHex, 16);
          setChainId(chainIdNum);

          // Create ethers provider
          const ethersProvider = new ethers.providers.Web3Provider(wallets[0].provider, 'any');
          setProvider(ethersProvider);
          setSigner(ethersProvider.getSigner());
          setConnected(true);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    const [primaryWallet] = onboard.state.get().wallets;
    if (primaryWallet) {
      await onboard.disconnectWallet({ label: primaryWallet.label });
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setChainId(null);
      setConnected(false);
    }
  };

  // Switch chain
  const switchChain = async (chainIdToSwitch: number) => {
    if (!connected) return;
    
    try {
      const chainIdHex = `0x${chainIdToSwitch.toString(16)}`;
      await onboard.setChain({ chainId: chainIdHex });
      
      // Update state
      setChainId(chainIdToSwitch);
      
      // Update provider and signer
      if (provider) {
        const updatedProvider = new ethers.providers.Web3Provider(provider.provider, 'any');
        setProvider(updatedProvider);
        setSigner(updatedProvider.getSigner());
      }
    } catch (error) {
      console.error('Chain switch error:', error);
    }
  };

  // Listen for wallet changes
  useEffect(() => {
    const walletsSub = onboard.state.select('wallets').subscribe(wallets => {
      if (wallets.length === 0) {
        setProvider(null);
        setSigner(null);
        setAddress(null);
        setChainId(null);
        setConnected(false);
        return;
      }

      const { accounts, chains } = wallets[0];
      
      if (accounts[0]) {
        setAddress(accounts[0].address);
        const chainIdHex = chains[0].id;
        const chainIdNum = parseInt(chainIdHex, 16);
        setChainId(chainIdNum);
        setConnected(true);
        
        // Update provider and signer
        const ethersProvider = new ethers.providers.Web3Provider(wallets[0].provider, 'any');
        setProvider(ethersProvider);
        setSigner(ethersProvider.getSigner());
      } else {
        setConnected(false);
        setProvider(null);
        setSigner(null);
      }
    });

    return () => {
      walletsSub.unsubscribe();
    };
  }, []);

  const walletContextValue: WalletContextType = {
    provider,
    address,
    chainId,
    connected,
    connecting,
    connect,
    disconnect,
    switchChain,
    signer
  };

  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  );
}