'use client';

/**
 * useContract — Hook para leer y escribir en los contratos.
 *
 * Funciones de lectura usan getReadProvider() (sin MetaMask).
 * Funciones de escritura usan el signer de WalletContext o la API /api/relay.
 */

import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getDaoContract, getReadProvider, Proposal } from '@/lib/contracts';
import { useWallet } from '@/contexts/WalletContext';

// ─── Balances del DAO ──────────────────────────────────────────────────────

export function useDaoBalances() {
  const { address } = useWallet();
  const [totalBalance, setTotalBalance] = useState<bigint>(BigInt(0));
  const [userBalance,  setUserBalance]  = useState<bigint>(BigInt(0));

  const refresh = useCallback(async () => {
    try {
      const provider = getReadProvider();
      const dao = getDaoContract(provider);
      const total = await dao.totalBalance();
      setTotalBalance(BigInt(total.toString()));

      if (address) {
        const user = await dao.getUserBalance(address);
        setUserBalance(BigInt(user.toString()));
      } else {
        setUserBalance(BigInt(0));
      }
    } catch {
      // silencioso si Anvil no está corriendo
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  return { totalBalance, userBalance, refresh };
}

// ─── Lista de propuestas ───────────────────────────────────────────────────

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading,   setLoading]   = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const provider = getReadProvider();
      const dao = getDaoContract(provider);
      const count = Number(await dao.getProposalCount());
      const items: Proposal[] = [];

      for (let i = count; i >= 1; i--) {
        const p = await dao.getProposal(i);
        items.push({
          id:           BigInt(p.id.toString()),
          recipient:    p.recipient,
          amount:       BigInt(p.amount.toString()),
          deadline:     BigInt(p.deadline.toString()),
          description:  p.description,
          votesFor:     BigInt(p.votesFor.toString()),
          votesAgainst: BigInt(p.votesAgainst.toString()),
          votesAbstain: BigInt(p.votesAbstain.toString()),
          executed:     p.executed,
        });
      }
      setProposals(items);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { proposals, loading, refresh };
}

// ─── Estado de voto del usuario en una propuesta ──────────────────────────

export function useUserVote(proposalId: bigint) {
  const { address } = useWallet();
  const [hasVoted, setHasVoted] = useState(false);
  const [voteType, setVoteType] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!address || proposalId === BigInt(0)) return;
    try {
      const provider = getReadProvider();
      const dao = getDaoContract(provider);
      const voted = await dao.hasVoted(proposalId, address);
      setHasVoted(voted);
      if (voted) {
        const vt = await dao.userVote(proposalId, address);
        setVoteType(Number(vt));
      }
    } catch {
      // silencioso
    }
  }, [address, proposalId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { hasVoted, voteType, refresh };
}

// ─── Acción: depositar ETH (transacción normal, no gasless) ───────────────

export function useFundDAO() {
  const { signer } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txHash,  setTxHash]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const fund = useCallback(async (amountEth: string) => {
    if (!signer) { setError('Conecta tu wallet primero.'); return; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      const dao = getDaoContract(signer);
      const value = ethers.parseEther(amountEth);
      const tx = await dao.fundDAO({ value });
      await tx.wait();
      setTxHash(tx.hash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al depositar');
    } finally {
      setLoading(false);
    }
  }, [signer]);

  return { fund, loading, txHash, error };
}
