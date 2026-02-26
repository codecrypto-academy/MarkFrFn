'use client';
import { useWallet } from '@/contexts/WalletContext';

export default function ConnectWallet() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  if (address) return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 font-mono">{address.slice(0,6)}…{address.slice(-4)}</span>
      <button onClick={disconnect} className="text-xs px-3 py-1 rounded border border-gray-600 text-gray-400 hover:text-white transition">
        Desconectar
      </button>
    </div>
  );
  return (
    <div>
      <button onClick={connect} disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition">
        {isConnecting ? 'Conectando…' : 'Conectar MetaMask'}
      </button>
      {error && <p className="mt-1 text-red-400 text-sm">{error}</p>}
    </div>
  );
}
