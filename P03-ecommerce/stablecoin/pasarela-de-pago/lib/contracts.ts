import { ethers } from 'ethers';
import { EUROTOKEN_ABI, PAYMENT_GATEWAY_ABI } from './abi';

export const EUROTOKEN_ADDRESS     = process.env.NEXT_PUBLIC_EUROTOKEN_ADDRESS!;
export const PAYMENT_GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS!;
export const CHAIN_ID              = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL               = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

export const EURT_DECIMALS = 6;

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getEuroTokenContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(EUROTOKEN_ADDRESS, EUROTOKEN_ABI, signerOrProvider);
}

export function getPaymentGatewayContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(PAYMENT_GATEWAY_ADDRESS, PAYMENT_GATEWAY_ABI, signerOrProvider);
}

export function eurToUnits(eur: number): bigint {
  return BigInt(Math.round(eur * 10 ** EURT_DECIMALS));
}

export function unitsToEur(units: bigint): number {
  return Number(units) / 10 ** EURT_DECIMALS;
}
