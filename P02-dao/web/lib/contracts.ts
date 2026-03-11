import { ethers } from 'ethers';
import { DAO_ABI, FORWARDER_ABI } from './abi';

export const DAO_ADDRESS       = process.env.NEXT_PUBLIC_DAO_ADDRESS!;
export const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS!;
export const CHAIN_ID          = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL           = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

// VoteType enum — must match DAOVoting.sol
export const VoteType = { FOR: 0, AGAINST: 1, ABSTAIN: 2 } as const;
export type VoteTypeValue = (typeof VoteType)[keyof typeof VoteType];

// Proposal type para el frontend
export interface Proposal {
  id:           bigint;
  recipient:    string;
  amount:       bigint;
  deadline:     bigint;
  description:  string;
  votesFor:     bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  executed:     boolean;
}

// Instancia de solo lectura (no requiere MetaMask)
export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getDaoContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(DAO_ADDRESS, DAO_ABI, signerOrProvider);
}

export function getForwarderContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, signerOrProvider);
}
