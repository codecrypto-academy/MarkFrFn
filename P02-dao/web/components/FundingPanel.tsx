'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useFundDAO } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';

interface Props {
  userBalance: bigint;
  totalBalance: bigint;
  onSuccess: () => void;
}

export default function FundingPanel({ userBalance, totalBalance, onSuccess }: Props) {
  const { isConnected } = useWallet();
  const { fund, loading, txHash, error } = useFundDAO();
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    await fund(amount);
    setAmount('');
    onSuccess();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-gray-400 text-sm mb-1">Tu balance en DAO</div>
          <div className="text-2xl font-mono font-bold text-green-400">
            {ethers.formatEther(userBalance)} ETH
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-gray-400 text-sm mb-1">Balance total DAO</div>
          <div className="text-2xl font-mono font-bold text-blue-400">
            {ethers.formatEther(totalBalance)} ETH
          </div>
        </div>
      </div>

      {/* Requisito para crear propuestas */}
      {totalBalance > BigInt(0) && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm">
            Para crear propuestas necesitas ≥ 10% del balance total (
            <span className="text-yellow-400 font-mono">
              {ethers.formatEther(totalBalance / BigInt(10))} ETH
            </span>
            )
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{
                width: totalBalance > BigInt(0)
                  ? `${Math.min(100, Number((userBalance * BigInt(100)) / totalBalance))}%`
                  : '0%',
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Tu participación: {totalBalance > BigInt(0)
              ? `${Number((userBalance * BigInt(100)) / totalBalance)}%`
              : '0%'}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">Depositar ETH en el DAO</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Cantidad (ETH)</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {txHash && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-400 text-sm font-mono">
            Tx: {txHash.slice(0, 20)}...
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isConnected || !amount}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Procesando...' : !isConnected ? 'Conecta tu wallet' : 'Depositar ETH'}
        </button>
      </form>
    </div>
  );
}
