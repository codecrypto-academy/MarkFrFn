'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { getReadProvider, getEscrowContract, getERC20Contract, ESCROW_ADDRESS } from '@/lib/contracts';

interface TokenInfo {
  address: string;
  symbol: string;
}

interface Props {
  onCreated?: () => void;
}

type Status = 'idle' | 'approving' | 'creating' | 'success' | 'error';

export default function CreateOperation({ onCreated }: Props) {
  const { address, signer } = useWallet();
  const [tokens, setTokens]   = useState<TokenInfo[]>([]);
  const [tokenA, setTokenA]   = useState('');
  const [tokenB, setTokenB]   = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [status, setStatus]   = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const fetchTokens = async () => {
    try {
      const provider = getReadProvider();
      const escrow = getEscrowContract(provider);
      const addrs: string[] = await escrow.getAllowedTokens();
      const infos = await Promise.all(
        addrs.map(async (addr) => {
          try {
            const symbol: string = await getERC20Contract(addr, provider).symbol();
            return { address: addr, symbol: String(symbol) };
          } catch {
            return { address: addr, symbol: addr.slice(0, 8) };
          }
        })
      );
      setTokens(infos);
      if (infos.length >= 1) setTokenA(infos[0].address);
      if (infos.length >= 2) setTokenB(infos[1].address);
    } catch { /* sin tokens aún */ }
  };

  useEffect(() => { fetchTokens(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !address || !tokenA || !tokenB || !amountA || !amountB) return;

    const amtA = ethers.parseUnits(amountA, 18);
    const amtB = ethers.parseUnits(amountB, 18);

    setMessage('');
    try {
      // 1. Approve
      setStatus('approving');
      setMessage('Aprobando TokenA… confirma en MetaMask.');
      const tokenContract = getERC20Contract(tokenA, signer);
      const approveTx = await tokenContract.approve(ESCROW_ADDRESS, amtA);
      await approveTx.wait();

      // 2. createOperation
      setStatus('creating');
      setMessage('Creando operación… confirma en MetaMask.');
      const escrow = getEscrowContract(signer);
      const tx = await escrow.createOperation(tokenA, tokenB, amtA, amtB);
      await tx.wait();

      setStatus('success');
      setMessage('✅ Operación creada correctamente.');
      setAmountA(''); setAmountB('');
      onCreated?.();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al crear operación');
      setStatus('error');
    }
  };

  const isBusy = status === 'approving' || status === 'creating';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold text-lg">➕ Crear operación</h2>

      {tokens.length < 2 ? (
        <p className="text-sm text-gray-500">Se necesitan al menos 2 tokens autorizados.</p>
      ) : !address ? (
        <p className="text-sm text-gray-500">Conecta MetaMask para crear operaciones.</p>
      ) : (
        <form onSubmit={handleCreate} className="space-y-3">
          {/* Token A */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Ofreces (Token A)</label>
            <div className="flex gap-2">
              <select
                value={tokenA}
                onChange={(e) => setTokenA(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {tokens.map((t) => (
                  <option key={t.address} value={t.address}>{t.symbol}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="Cantidad"
                className="w-28 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Token B */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Solicitas (Token B)</label>
            <div className="flex gap-2">
              <select
                value={tokenB}
                onChange={(e) => setTokenB(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {tokens.map((t) => (
                  <option key={t.address} value={t.address}>{t.symbol}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="Cantidad"
                className="w-28 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy || !amountA || !amountB || tokenA === tokenB}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition text-sm"
          >
            {status === 'approving' ? 'Aprobando…'
              : status === 'creating' ? 'Creando…'
              : 'Crear operación'}
          </button>

          {message && (
            <p className={`text-xs ${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
