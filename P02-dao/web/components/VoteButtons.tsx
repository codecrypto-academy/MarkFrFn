'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { DAO_ADDRESS, getDaoContract, VoteType, VoteTypeValue } from '@/lib/contracts';
import { signMetaTxRequest, serializeRequest } from '@/lib/metaTx';

interface Props {
  proposalId: bigint;
  currentVote: number | null;
  hasVoted: boolean;
  onSuccess: () => void;
}

const VOTE_LABELS: Record<number, string> = {
  [VoteType.FOR]:     'A FAVOR',
  [VoteType.AGAINST]: 'EN CONTRA',
  [VoteType.ABSTAIN]: 'ABSTENCIÓN',
};

const VOTE_STYLES: Record<number, string> = {
  [VoteType.FOR]:     'bg-green-600 hover:bg-green-500',
  [VoteType.AGAINST]: 'bg-red-600 hover:bg-red-500',
  [VoteType.ABSTAIN]: 'bg-gray-600 hover:bg-gray-500',
};

const ACTIVE_STYLES: Record<number, string> = {
  [VoteType.FOR]:     'ring-2 ring-green-400',
  [VoteType.AGAINST]: 'ring-2 ring-red-400',
  [VoteType.ABSTAIN]: 'ring-2 ring-gray-400',
};

export default function VoteButtons({ proposalId, currentVote, hasVoted, onSuccess }: Props) {
  const { signer, provider, isConnected } = useWallet();
  const [loading, setLoading]   = useState<number | null>(null);
  const [error,   setError]     = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const castVote = async (voteType: VoteTypeValue) => {
    if (!signer || !provider) return;
    setLoading(voteType);
    setError(null);
    setSuccess(null);

    try {
      const dao = getDaoContract(provider);
      const iface = new (await import('ethers')).ethers.Interface(dao.interface.fragments);
      const data = iface.encodeFunctionData('vote', [proposalId, voteType]);

      const { request, signature } = await signMetaTxRequest(signer, provider, DAO_ADDRESS, data);

      const res = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: serializeRequest(request), signature }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error en el relayer');

      setSuccess(`Voto registrado (${VOTE_LABELS[voteType]})`);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al votar');
    } finally {
      setLoading(null);
    }
  };

  if (!isConnected) {
    return <p className="text-xs text-gray-500 mt-2">Conecta tu wallet para votar</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        {([VoteType.FOR, VoteType.AGAINST, VoteType.ABSTAIN] as VoteTypeValue[]).map(vt => (
          <button
            key={vt}
            onClick={() => castVote(vt)}
            disabled={loading !== null}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg text-white transition-all disabled:opacity-50
              ${VOTE_STYLES[vt]}
              ${hasVoted && currentVote === vt ? ACTIVE_STYLES[vt] : ''}
            `}
          >
            {loading === vt ? '...' : VOTE_LABELS[vt]}
          </button>
        ))}
      </div>

      {hasVoted && currentVote !== null && (
        <p className="text-xs text-gray-400">
          Tu voto actual: <span className="font-medium">{VOTE_LABELS[currentVote]}</span> (puedes cambiarlo)
        </p>
      )}

      {error   && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-green-400">{success}</p>}
    </div>
  );
}
