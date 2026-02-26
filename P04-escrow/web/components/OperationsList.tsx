'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import {
  getReadProvider, getEscrowContract, getERC20Contract,
  ESCROW_ADDRESS, Operation, formatAmount,
} from '@/lib/contracts';

interface TokenSymbols {
  [address: string]: string;
}

export default function OperationsList() {
  const { address, signer } = useWallet();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [symbols, setSymbols]       = useState<TokenSymbols>({});
  const [loading, setLoading]       = useState(false);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [message, setMessage]       = useState('');

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const provider = getReadProvider();
      const escrow = getEscrowContract(provider);
      const ops = await escrow.getAllOperations() as unknown as Operation[];
      setOperations(ops);

      // Cargar símbolos de los tokens únicos
      const uniqueTokens = [...new Set(ops.flatMap((op) => [op.tokenA, op.tokenB]))];
      const entries = await Promise.all(
        uniqueTokens.map(async (addr) => {
          try {
            const sym: string = await getERC20Contract(addr, provider).symbol();
            return [addr, String(sym)] as const;
          } catch {
            return [addr, addr.slice(0, 6)] as const;
          }
        })
      );
      setSymbols(Object.fromEntries(entries));
    } catch {
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial + auto-refresh cada 5 s
  useEffect(() => {
    fetchOperations();
    const interval = setInterval(fetchOperations, 5000);
    return () => clearInterval(interval);
  }, [fetchOperations]);

  const cancelOp = async (op: Operation) => {
    if (!signer) return;
    setActionId(op.id.toString()); setMessage('');
    try {
      const escrow = getEscrowContract(signer);
      const tx = await escrow.cancelOperation(op.id);
      await tx.wait();
      setMessage('✅ Operación cancelada.');
      await fetchOperations();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al cancelar');
    } finally { setActionId(null); }
  };

  const completeOp = async (op: Operation) => {
    if (!signer || !address) return;
    setActionId(op.id.toString()); setMessage('');
    try {
      // 1. Approve tokenB
      setMessage('Aprobando TokenB… confirma en MetaMask.');
      const tokenContract = getERC20Contract(op.tokenB, signer);
      const approveTx = await tokenContract.approve(ESCROW_ADDRESS, op.amountB);
      await approveTx.wait();

      // 2. completeOperation
      setMessage('Completando operación… confirma en MetaMask.');
      const escrow = getEscrowContract(signer);
      const tx = await escrow.completeOperation(op.id);
      await tx.wait();

      setMessage('✅ ¡Swap completado!');
      await fetchOperations();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al completar');
    } finally { setActionId(null); }
  };

  const activeOps   = operations.filter((op) => op.isActive);
  const inactiveOps = operations.filter((op) => !op.isActive);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">📋 Operaciones</h2>
        <button
          onClick={fetchOperations}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white transition"
        >
          {loading ? '↻' : '↻ Refresh'}
        </button>
      </div>

      {message && (
        <p className={`text-xs px-3 py-2 rounded-lg ${message.startsWith('✅') ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
          {message}
        </p>
      )}

      {operations.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No hay operaciones aún.</p>
      ) : (
        <div className="space-y-3">
          {/* Activas */}
          {activeOps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Activas</p>
              {activeOps.map((op) => {
                const isCreator = address?.toLowerCase() === op.creator.toLowerCase();
                const isBusy    = actionId === op.id.toString();
                return (
                  <div key={op.id.toString()} className="bg-gray-900 border border-gray-600 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Op #{op.id.toString()}</span>
                      <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Activa</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Ofrece: </span>
                      <span className="text-white font-semibold">{formatAmount(op.amountA)} {symbols[op.tokenA] ?? '…'}</span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="text-gray-400">Pide: </span>
                      <span className="text-white font-semibold">{formatAmount(op.amountB)} {symbols[op.tokenB] ?? '…'}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Creador: <span className="font-mono">{op.creator.slice(0,8)}…</span>
                      {isCreator && <span className="ml-1 text-yellow-400">(tú)</span>}
                    </p>
                    {address && (
                      <div className="pt-1">
                        {isCreator ? (
                          <button
                            onClick={() => cancelOp(op)}
                            disabled={isBusy}
                            className="text-xs px-3 py-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition"
                          >
                            {isBusy ? '…' : 'Cancelar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => completeOp(op)}
                            disabled={isBusy}
                            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition"
                          >
                            {isBusy ? message || '…' : 'Completar swap'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cerradas */}
          {inactiveOps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cerradas</p>
              {inactiveOps.map((op) => (
                <div key={op.id.toString()} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-1 opacity-60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Op #{op.id.toString()}</span>
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Cerrada</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatAmount(op.amountA)} {symbols[op.tokenA] ?? '…'}
                    <span className="mx-1">↔</span>
                    {formatAmount(op.amountB)} {symbols[op.tokenB] ?? '…'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
