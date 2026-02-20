import { ethers } from 'ethers';
import { ECOMMERCE_MAIN_ABI, SHOPPING_CART_ABI, INVOICE_SYSTEM_ABI } from './abi';

export const ECOMMERCE_MAIN_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_MAIN_ADDRESS!;
export const CHAIN_ID               = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL                = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';
export const PAYMENT_GATEWAY_URL    = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL ?? 'http://localhost:6002';

export const EURT_DECIMALS = 6;

export interface Product {
  productId: bigint; companyId: bigint; companyAddress: string;
  name: string; description: string; price: bigint; stock: bigint;
  ipfsImageHash: string; isActive: boolean; createdAt: bigint;
}

export interface CartItem {
  productId: bigint; quantity: bigint; unitPrice: bigint;
}

export interface Invoice {
  invoiceId: bigint; companyId: bigint; companyAddress: string;
  customerAddress: string; totalAmount: bigint; timestamp: bigint;
  isPaid: boolean; paymentTxHash: string;
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getMainContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ECOMMERCE_MAIN_ADDRESS, ECOMMERCE_MAIN_ABI, signerOrProvider);
}

export function getCartContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, SHOPPING_CART_ABI, signerOrProvider);
}

export function getInvoiceContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, INVOICE_SYSTEM_ABI, signerOrProvider);
}

export function unitsToEur(units: bigint): number {
  return Number(units) / 10 ** EURT_DECIMALS;
}
