'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletInfo } from '@/types/ethereum';
import { EthersUtils } from '@/utils/ethers';

interface MetaMaskContextType {
  isConnected: boolean;
  currentAccount: string | null;
  currentWallet: WalletInfo | null;
  wallets: WalletInfo[];
  connect: (walletIndex: number) => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  switchWallet: (walletIndex: number) => Promise<void>;
  getBalance: () => Promise<string>;
}

export const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

interface MetaMaskProviderProps {
  children: ReactNode;
}

// Cargar wallets desde variables de entorno
function loadAnvilWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [];

  // Hardcoded wallets para asegurar que funcionan
  // (Las variables de entorno se cargarán desde .env.local)
  const hardcodedWallets = [
    {
      address: process.env.NEXT_PUBLIC_WALLET_1_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: process.env.NEXT_PUBLIC_WALLET_1_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      name: 'Wallet 1',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_2_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: process.env.NEXT_PUBLIC_WALLET_2_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      name: 'Wallet 2',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_3_ADDRESS || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      privateKey: process.env.NEXT_PUBLIC_WALLET_3_PRIVATE_KEY || '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      name: 'Wallet 3',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_4_ADDRESS || '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      privateKey: process.env.NEXT_PUBLIC_WALLET_4_PRIVATE_KEY || '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
      name: 'Wallet 4',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_5_ADDRESS || '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      privateKey: process.env.NEXT_PUBLIC_WALLET_5_PRIVATE_KEY || '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
      name: 'Wallet 5',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_6_ADDRESS || '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      privateKey: process.env.NEXT_PUBLIC_WALLET_6_PRIVATE_KEY || '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
      name: 'Wallet 6',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_7_ADDRESS || '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      privateKey: process.env.NEXT_PUBLIC_WALLET_7_PRIVATE_KEY || '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
      name: 'Wallet 7',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_8_ADDRESS || '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
      privateKey: process.env.NEXT_PUBLIC_WALLET_8_PRIVATE_KEY || '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
      name: 'Wallet 8',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_9_ADDRESS || '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
      privateKey: process.env.NEXT_PUBLIC_WALLET_9_PRIVATE_KEY || '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
      name: 'Wallet 9',
    },
    {
      address: process.env.NEXT_PUBLIC_WALLET_10_ADDRESS || '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
      privateKey: process.env.NEXT_PUBLIC_WALLET_10_PRIVATE_KEY || '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
      name: 'Wallet 10',
    },
  ];

  hardcodedWallets.forEach((wallet) => {
    if (wallet.address && wallet.privateKey) {
      wallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: wallet.name,
        balance: '10000 ETH',
      });
    }
  });

  console.log(`🔑 Loaded ${wallets.length} Anvil wallets from .env.local`);
  return wallets;
}

export function MetaMaskProvider({ children }: MetaMaskProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentWallet, setCurrentWallet] = useState<WalletInfo | null>(null);
  const wallets = loadAnvilWallets();

  const connect = useCallback(
    async (walletIndex: number) => {
      try {
        if (walletIndex < 0 || walletIndex >= wallets.length) {
          throw new Error('Invalid wallet index');
        }

        const wallet = wallets[walletIndex];
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';

        // Crear instancia de Wallet
        const ethersWallet = EthersUtils.createWallet(wallet.privateKey, rpcUrl);

        setCurrentWallet(wallet);
        setCurrentAccount(wallet.address);
        setIsConnected(true);

        console.log(`✅ Connected to ${wallet.name} (${wallet.address})`);
      } catch (error) {
        console.error('❌ Error connecting wallet:', error);
        throw error;
      }
    },
    [wallets]
  );

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setCurrentAccount(null);
    setCurrentWallet(null);
    console.log('🔌 Disconnected');
  }, []);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!currentWallet) {
        throw new Error('No wallet connected');
      }

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
      const wallet = EthersUtils.createWallet(currentWallet.privateKey, rpcUrl);

      return await EthersUtils.signMessage(message, wallet);
    },
    [currentWallet]
  );

  const switchWallet = useCallback(
    async (walletIndex: number) => {
      await connect(walletIndex);
    },
    [connect]
  );

  const getBalance = useCallback(async (): Promise<string> => {
    if (!currentWallet) {
      return '0';
    }

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(currentWallet.address);
      const balanceEth = ethers.formatEther(balance);
      console.log(`💰 Balance: ${balanceEth} ETH`);
      return balanceEth;
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      return '0';
    }
  }, [currentWallet]);

  const value: MetaMaskContextType = {
    isConnected,
    currentAccount,
    currentWallet,
    wallets,
    connect,
    disconnect,
    signMessage,
    switchWallet,
    getBalance,
  };

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error('useMetaMask must be used within MetaMaskProvider');
  }
  return context;
}
