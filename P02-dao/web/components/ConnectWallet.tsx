'use client';

import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

interface Props {
  userBalance: bigint;
  totalBalance: bigint;
}

export default function ConnectWallet({ userBalance, totalBalance }: Props) {
  const { address, isConnected, isConnecting, error, connect, disconnect } = useWallet();

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex items-center gap-4">
      {isConnected && address ? (
        <div className="flex items-center gap-3">
          <div className="text-sm text-right hidden sm:block">
            <div className="text-gray-400">Tu balance en DAO</div>
            <div className="font-mono font-semibold text-green-400">
              {ethers.formatEther(userBalance)} ETH
            </div>
          </div>
          <div className="text-sm text-right hidden sm:block">
            <div className="text-gray-400">Balance total DAO</div>
            <div className="font-mono font-semibold text-blue-400">
              {ethers.formatEther(totalBalance)} ETH
            </div>
          </div>
          <button
            onClick={disconnect}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg font-mono"
          >
            {short(address)}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          <button
            onClick={connect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg font-medium"
          >
            {isConnecting ? 'Conectando...' : 'Conectar MetaMask'}
          </button>
        </div>
      )}
    </div>
  );
}
