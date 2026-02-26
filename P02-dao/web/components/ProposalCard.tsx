'use client';

import { ethers } from 'ethers';
import { Proposal } from '@/lib/contracts';
import { useUserVote } from '@/hooks/useContract';
import VoteButtons from './VoteButtons';

interface Props {
  proposal: Proposal;
  onRefresh: () => void;
}

function getStatus(p: Proposal): { label: string; color: string } {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (p.executed)                                  return { label: 'Ejecutada',        color: 'text-blue-400' };
  if (now < p.deadline)                            return { label: 'Activa',           color: 'text-green-400' };
  if (p.votesFor > p.votesAgainst)                 return { label: 'Aprobada (pendiente)', color: 'text-yellow-400' };
  return                                                  { label: 'Rechazada',        color: 'text-red-400' };
}

function formatDeadline(deadline: bigint): string {
  const date = new Date(Number(deadline) * 1000);
  return date.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

function VoteBar({ votesFor, votesAgainst, votesAbstain }: { votesFor: bigint; votesAgainst: bigint; votesAbstain: bigint }) {
  const total = Number(votesFor) + Number(votesAgainst) + Number(votesAbstain);
  if (total === 0) return <div className="text-xs text-gray-500 mt-1">Sin votos aún</div>;

  const pFor     = Math.round(Number(votesFor)     / total * 100);
  const pAgainst = Math.round(Number(votesAgainst) / total * 100);
  const pAbstain = 100 - pFor - pAgainst;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className="bg-green-500 transition-all" style={{ width: `${pFor}%` }} />
        <div className="bg-red-500 transition-all"   style={{ width: `${pAgainst}%` }} />
        <div className="bg-gray-500 transition-all"  style={{ width: `${pAbstain}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span className="text-green-400">{votesFor.toString()} a favor</span>
        <span className="text-red-400">{votesAgainst.toString()} en contra</span>
        <span className="text-gray-400">{votesAbstain.toString()} abstención</span>
      </div>
    </div>
  );
}

export default function ProposalCard({ proposal, onRefresh }: Props) {
  const { hasVoted, voteType, refresh: refreshVote } = useUserVote(proposal.id);
  const { label, color } = getStatus(proposal);
  const isActive = BigInt(Math.floor(Date.now() / 1000)) < proposal.deadline && !proposal.executed;

  const handleVoteSuccess = () => {
    refreshVote();
    onRefresh();
  };

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-gray-500 font-mono">#{proposal.id.toString()}</span>
          <h4 className="font-semibold text-white mt-0.5 line-clamp-2">
            {proposal.description || 'Sin descripción'}
          </h4>
        </div>
        <span className={`text-xs font-medium ${color} ml-2 shrink-0`}>{label}</span>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-gray-400 text-xs">Beneficiario</div>
          <div className="font-mono text-xs text-gray-200 break-all">
            {proposal.recipient.slice(0, 8)}...{proposal.recipient.slice(-4)}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Monto</div>
          <div className="font-mono font-semibold text-yellow-400">
            {ethers.formatEther(proposal.amount)} ETH
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-400 text-xs">Deadline</div>
          <div className="text-gray-200 text-xs">{formatDeadline(proposal.deadline)}</div>
        </div>
      </div>

      {/* Barra de votos */}
      <VoteBar
        votesFor={proposal.votesFor}
        votesAgainst={proposal.votesAgainst}
        votesAbstain={proposal.votesAbstain}
      />

      {/* Botones de votación — solo si está activa */}
      {isActive && (
        <VoteButtons
          proposalId={proposal.id}
          currentVote={voteType}
          hasVoted={hasVoted}
          onSuccess={handleVoteSuccess}
        />
      )}
    </div>
  );
}
