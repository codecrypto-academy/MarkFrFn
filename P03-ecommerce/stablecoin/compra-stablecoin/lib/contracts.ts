import { ethers } from 'ethers';
import { EUROTOKEN_ABI } from './abi';

export const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_ADDRESS!;
export const CHAIN_ID          = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL           = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

// 1 EURT tiene 6 decimales — igual que USDC
export const EURT_DECIMALS = 6;

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getEuroTokenContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(EUROTOKEN_ADDRESS, EUROTOKEN_ABI, signerOrProvider);
}

/// Convierte euros (número) a unidades mínimas EURT (bigint)
export function eurToUnits(eur: number): bigint {
  return BigInt(Math.round(eur * 10 ** EURT_DECIMALS));
}

/// Convierte unidades mínimas EURT (bigint) a euros (número)
export function unitsToEur(units: bigint): number {
  return Number(units) / 10 ** EURT_DECIMALS;
}
