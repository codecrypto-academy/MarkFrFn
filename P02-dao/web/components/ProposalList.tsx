'use client';

import { useProposals } from '@/hooks/useContract';
import ProposalCard from './ProposalCard';

export default function ProposalList() {
  const { proposals, loading, refresh } = useProposals();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-800 rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-6 bg-gray-700 rounded w-2/3 mb-4" />
            <div className="h-2 bg-gray-700 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-3">📋</div>
        <div>No hay propuestas todavía.</div>
        <div className="text-sm mt-1">Deposita ETH y crea la primera.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-gray-400 text-sm">{proposals.length} propuesta{proposals.length !== 1 ? 's' : ''}</h3>
        <button
          onClick={refresh}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Actualizar
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map(p => (
          <ProposalCard key={p.id.toString()} proposal={p} onRefresh={refresh} />
        ))}
      </div>
    </div>
  );
}
