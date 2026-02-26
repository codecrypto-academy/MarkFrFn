'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { DAO_ADDRESS, getReadProvider } from '@/lib/contracts';
import { getDaoContract } from '@/lib/contracts';
import { signMetaTxRequest, serializeRequest } from '@/lib/metaTx';

interface Props {
  userBalance: bigint;
  totalBalance: bigint;
  onSuccess: () => void;
}

export default function CreateProposal({ userBalance, totalBalance, onSuccess }: Props) {
  const { signer, provider, isConnected } = useWallet();
  const [recipient,    setRecipient]    = useState('');
  const [amount,       setAmount]       = useState('');
  const [minutes,      setMinutes]      = useState('5');
  const [description,  setDescription]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [status,       setStatus]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const canCreate = totalBalance > BigInt(0) &&
    userBalance * BigInt(100) >= totalBalance * BigInt(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !provider) return;
    setLoading(true);
    setStatus(null);

    try {
      const dao = getDaoContract(provider);
      const amountWei = ethers.parseEther(amount);
      const deadline  = BigInt(Math.floor(Date.now() / 1000) + Number(minutes) * 60);

      // Encode la llamada createProposal para enviársela al forwarder
      const iface = new ethers.Interface(dao.interface.fragments);
      const data = iface.encodeFunctionData('createProposal', [
        recipient, amountWei, deadline, description,
      ]);

      // Firmar la meta-tx con MetaMask (EIP-712) — no se paga gas
      const { request, signature } = await signMetaTxRequest(signer, provider, DAO_ADDRESS, data);

      // Enviar al relayer (server-side paga el gas)
      const res = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: serializeRequest(request), signature }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error en el relayer');

      setStatus({ type: 'success', msg: `Propuesta creada. Tx: ${(json.txHash as string).slice(0, 20)}...` });
      setRecipient(''); setAmount(''); setDescription('');
      onSuccess();
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Error inesperado' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">Nueva Propuesta</h3>

        {!canCreate && isConnected && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-400 text-sm">
            Necesitas al menos el 10% del balance total del DAO para crear propuestas.
            {totalBalance > BigInt(0) && (
              <span className="block mt-1">
                Mínimo: <span className="font-mono">{ethers.formatEther(totalBalance / BigInt(10))} ETH</span>
              </span>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Dirección del beneficiario</label>
          <input
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Monto (ETH)</label>
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">Duración (minutos)</label>
            <input
              type="number"
              min="2"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe el propósito de la propuesta..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {status && (
          <div className={`rounded-lg p-3 text-sm ${
            status.type === 'success'
              ? 'bg-green-900/30 border border-green-700 text-green-400'
              : 'bg-red-900/30 border border-red-700 text-red-400'
          }`}>
            {status.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isConnected || !canCreate || !recipient || !amount}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Firmando y enviando...' : !isConnected ? 'Conecta tu wallet' : 'Crear Propuesta (Gasless)'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Esta operación es gasless — MetaMask pedirá una firma, no una transacción.
        </p>
      </form>
    </div>
  );
}
