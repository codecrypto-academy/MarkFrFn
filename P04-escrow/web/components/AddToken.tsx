'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getReadProvider, getEscrowContract, getERC20Contract, ESCROW_ADDRESS } from '@/lib/contracts';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
}

interface Props {
  onTokenAdded?: () => void;
}

export default function AddToken({ onTokenAdded }: Props) {
  const { address, signer } = useWallet();
  const [owner, setOwner]       = useState<string | null>(null);
  const [tokens, setTokens]     = useState<TokenInfo[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');

  const fetchOwnerAndTokens = async () => {
    try {
      const provider = getReadProvider();
      const escrow = getEscrowContract(provider);
      const ownerAddr: string = await escrow.owner();
      setOwner(ownerAddr);

      const addrs: string[] = await escrow.getAllowedTokens();
      const infos = await Promise.all(
        addrs.map(async (addr) => {
          try {
            const token = getERC20Contract(addr, provider);
            const [symbol, name] = await Promise.all([token.symbol(), token.name()]);
            return { address: addr, symbol: String(symbol), name: String(name) };
          } catch {
            return { address: addr, symbol: '???', name: addr };
          }
        })
      );
      setTokens(infos);
    } catch { /* contrato no disponible aún */ }
  };

  useEffect(() => { fetchOwnerAndTokens(); }, []);

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !input) return;
    setLoading(true); setMessage('');
    try {
      const escrow = getEscrowContract(signer);
      const tx = await escrow.addToken(input.trim());
      await tx.wait();
      setInput('');
      setMessage('✅ Token agregado.');
      await fetchOwnerAndTokens();
      onTokenAdded?.();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al agregar token');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold text-lg">🪙 Tokens permitidos</h2>

      {/* Lista de tokens */}
      {tokens.length === 0 ? (
        <p className="text-sm text-gray-500">No hay tokens autorizados aún.</p>
      ) : (
        <ul className="space-y-1">
          {tokens.map((t) => (
            <li key={t.address} className="flex items-center justify-between text-sm">
              <span className="text-green-400 font-semibold">{t.symbol}</span>
              <span className="text-gray-500 font-mono text-xs">{t.address.slice(0,8)}…{t.address.slice(-4)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario solo para el owner */}
      {isOwner && (
        <form onSubmit={handleAdd} className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs text-yellow-400">Owner — agregar token</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x... dirección del token"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {loading ? '…' : 'Agregar'}
            </button>
          </div>
          {message && (
            <p className={`text-xs ${message.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </form>
      )}

      <p className="text-xs text-gray-600">
        Escrow: <span className="font-mono">{ESCROW_ADDRESS?.slice(0,8)}…</span>
      </p>
    </div>
  );
}
