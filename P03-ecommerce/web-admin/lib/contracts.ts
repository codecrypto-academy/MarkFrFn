import { ethers } from 'ethers';
import { ECOMMERCE_MAIN_ABI, COMPANY_REGISTRY_ABI, PRODUCT_CATALOG_ABI, EUROTOKEN_ABI } from './abi';

export const ECOMMERCE_MAIN_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_MAIN_ADDRESS!;
export const CHAIN_ID               = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL                = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

export const EURT_DECIMALS = 6;

export interface Product {
  productId: bigint;
  companyId: bigint;
  companyAddress: string;
  name: string;
  description: string;
  price: bigint;
  stock: bigint;
  ipfsImageHash: string;
  isActive: boolean;
  createdAt: bigint;
}

export interface Company {
  companyId: bigint;
  companyAddress: string;
  name: string;
  description: string;
  isActive: boolean;
  registrationDate: bigint;
}

export interface Invoice {
  invoiceId: bigint;
  companyId: bigint;
  companyAddress: string;
  customerAddress: string;
  totalAmount: bigint;
  timestamp: bigint;
  isPaid: boolean;
  paymentTxHash: string;
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getMainContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ECOMMERCE_MAIN_ADDRESS, ECOMMERCE_MAIN_ABI, signerOrProvider);
}

export function getCompanyRegistryContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, COMPANY_REGISTRY_ABI, signerOrProvider);
}

export function getProductCatalogContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, PRODUCT_CATALOG_ABI, signerOrProvider);
}

export function getEuroTokenContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, EUROTOKEN_ABI, signerOrProvider);
}

export function unitsToEur(units: bigint): number {
  return Number(units) / 10 ** EURT_DECIMALS;
}

export function eurToUnits(eur: number): bigint {
  return BigInt(Math.round(eur * 10 ** EURT_DECIMALS));
}
