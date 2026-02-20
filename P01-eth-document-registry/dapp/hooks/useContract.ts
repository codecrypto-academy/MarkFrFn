import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from '@/contexts/MetaMaskContext';

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'hash', type: 'bytes32' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'storeDocumentHash',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'hash', type: 'bytes32' },
      { internalType: 'address', name: 'signer', type: 'address' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'verifyDocument',
    outputs: [{ internalType: 'bool', name: 'isValid', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'hash', type: 'bytes32' }],
    name: 'getDocumentInfo',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'hash', type: 'bytes32' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'address', name: 'signer', type: 'address' },
          { internalType: 'bytes', name: 'signature', type: 'bytes' },
        ],
        internalType: 'struct DocumentRegistry.Document',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'hash', type: 'bytes32' }],
    name: 'isDocumentStored',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDocumentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getDocumentHashByIndex',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export function useContract() {
  const { currentWallet } = useMetaMask();

  const getContract = useCallback(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS not configured');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    if (!currentWallet) {
      return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    }

    const wallet = new ethers.Wallet(currentWallet.privateKey, provider);
    return new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
  }, [currentWallet]);

  const storeDocument = useCallback(
    async (hash: string, timestamp: number, signature: string) => {
      try {
        const contract = getContract();
        const tx = await contract.storeDocumentHash(hash, timestamp, signature);
        const receipt = await tx.wait();
        console.log('✅ Document stored:', { hash, timestamp, tx: receipt?.hash });
        return receipt;
      } catch (error) {
        console.error('❌ Error storing document:', error);
        throw error;
      }
    },
    [getContract]
  );

  const verifyDocument = useCallback(
    async (hash: string, signer: string, signature: string): Promise<boolean> => {
      try {
        const contract = getContract();
        const isValid = await contract.verifyDocument(hash, signer, signature);
        console.log('✅ Document verified:', { hash, signer, isValid });
        return isValid;
      } catch (error) {
        console.error('❌ Error verifying document:', error);
        return false;
      }
    },
    [getContract]
  );

  const getDocumentInfo = useCallback(
    async (hash: string) => {
      try {
        const contract = getContract();
        const info = await contract.getDocumentInfo(hash);
        console.log('✅ Document info retrieved:', info);
        return info;
      } catch (error) {
        console.error('❌ Error getting document info:', error);
        throw error;
      }
    },
    [getContract]
  );

  const isDocumentStored = useCallback(
    async (hash: string): Promise<boolean> => {
      try {
        const contract = getContract();
        const stored = await contract.isDocumentStored(hash);
        console.log('✅ Document stored check:', { hash, stored });
        return stored;
      } catch (error) {
        console.error('❌ Error checking if document stored:', error);
        return false;
      }
    },
    [getContract]
  );

  const getDocumentCount = useCallback(async (): Promise<number> => {
    try {
      const contract = getContract();
      const count = await contract.getDocumentCount();
      return Number(count);
    } catch (error) {
      console.error('❌ Error getting document count:', error);
      return 0;
    }
  }, [getContract]);

  const getDocumentHashByIndex = useCallback(
    async (index: number): Promise<string> => {
      try {
        const contract = getContract();
        const hash = await contract.getDocumentHashByIndex(index);
        return hash as string;
      } catch (error) {
        console.error('❌ Error getting document hash by index:', error);
        throw error;
      }
    },
    [getContract]
  );

  return {
    storeDocument,
    verifyDocument,
    getDocumentInfo,
    isDocumentStored,
    getDocumentCount,
    getDocumentHashByIndex,
  };
}
