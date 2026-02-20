import { useCallback } from 'react';
import { HashUtils } from '@/utils/hash';

export function useFileHash() {
  const calculateSha256 = useCallback(async (file: File): Promise<string> => {
    return await HashUtils.sha256(file);
  }, []);

  const calculateKeccak256 = useCallback(async (file: File): Promise<string> => {
    return await HashUtils.keccak256(file);
  }, []);

  const getFileInfo = useCallback((file: File) => {
    return HashUtils.getFileInfo(file);
  }, []);

  const formatHash = useCallback((hash: string, length?: number) => {
    return HashUtils.formatHash(hash, length);
  }, []);

  return {
    calculateSha256,
    calculateKeccak256,
    getFileInfo,
    formatHash,
  };
}
