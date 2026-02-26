import { ethers } from 'ethers';
import { ESCROW_ABI, ERC20_ABI } from './abi';

export const ESCROW_ADDRESS  = process.env.NEXT_PUBLIC_ESCROW_ADDRESS!;
export const TOKEN_A_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS!;
export const TOKEN_B_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS!;
export const CHAIN_ID        = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL         = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

// Cuentas de prueba de Anvil (públicamente conocidas)
export const ANVIL_ACCOUNTS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // #0 — owner
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // #1
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // #2
] as const;

export interface Operation {
  id:       bigint;
  creator:  string;
  tokenA:   string;
  tokenB:   string;
  amountA:  bigint;
  amountB:  bigint;
  isActive: boolean;
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getEscrowContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signerOrProvider);
}

export function getERC20Contract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, ERC20_ABI, signerOrProvider);
}

export function formatAmount(amount: bigint, decimals = 18): string {
  return Number(ethers.formatUnits(amount, decimals)).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
