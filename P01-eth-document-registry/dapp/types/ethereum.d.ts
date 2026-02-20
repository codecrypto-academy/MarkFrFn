// Type definitions for Ethereum integration

export interface Document {
  hash: string;
  timestamp: number;
  signer: string;
  signature: string;
  exists: boolean;
}

export interface WalletInfo {
  address: string;
  privateKey: string;
  name: string;
  balance: string;
}

export interface SignatureResult {
  hash: string;
  signature: string;
  signer: string;
  message: string;
}

export interface VerificationResult {
  isValid: boolean;
  signer: string;
  hash: string;
  timestamp?: number;
}
