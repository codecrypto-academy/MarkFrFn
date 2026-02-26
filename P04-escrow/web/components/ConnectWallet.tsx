'use client';

import { useWallet } from '@/contexts/WalletContext';

export default function ConnectWallet() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300 font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
      >
        {isConnecting ? 'Conectando…' : 'Conectar MetaMask'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
