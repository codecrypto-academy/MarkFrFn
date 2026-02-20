'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useFileHash } from '@/hooks/useFileHash';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DocumentVerifierProps {
  onVerificationComplete?: (result: boolean) => void;
}

export function DocumentVerifier({ onVerificationComplete }: DocumentVerifierProps) {
  const [file, setFile] = useState<File | null>(null);
  const [signer, setSigner] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    isValid: boolean;
    hash?: string;
    message?: string;
  } | null>(null);
  const { isDocumentStored, getDocumentInfo } = useContract();
  const { calculateKeccak256, formatHash } = useFileHash();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!file || !signer.trim()) {
      alert('Please select a file and enter signer address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const hash = await calculateKeccak256(file);

      // Step 1: check if the document is registered on-chain
      const stored = await isDocumentStored(hash);
      if (!stored) {
        setResult({
          isValid: false,
          hash,
          message: 'Document not found on blockchain',
        });
        onVerificationComplete?.(false);
        return;
      }

      // Step 2: retrieve the stored signer and compare
      const doc = await getDocumentInfo(hash);
      const storedSigner: string = doc.signer;
      const isValid = storedSigner.toLowerCase() === signer.trim().toLowerCase();

      setResult({
        isValid,
        hash,
        message: isValid
          ? `Document is authentic. Stored signer: ${storedSigner}`
          : `Signer mismatch. Expected: ${storedSigner.slice(0, 6)}...${storedSigner.slice(-4)}`,
      });

      onVerificationComplete?.(isValid);

      console.log('✅ Verification result:', {
        file: file.name,
        hash,
        queriedSigner: signer,
        storedSigner,
        isValid,
      });
    } catch (error) {
      console.error('❌ Verification error:', error);
      setResult({
        isValid: false,
        message: `Error: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-4">Verify Document</h2>

      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Select File</label>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 disabled:bg-gray-50"
            accept="*/*"
          />
          {file && <p className="text-sm text-gray-600 mt-1">📄 {file.name}</p>}
        </div>

        {/* Signer Address */}
        <div>
          <label className="block text-sm font-medium mb-2">Signer Address</label>
          <input
            type="text"
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
            placeholder="0x..."
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 disabled:bg-gray-50 font-mono text-sm"
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={!file || !signer.trim() || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Verifying...' : 'Verify Document'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-lg border ${
            result.isValid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.isValid ? (
              <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
            ) : (
              <XCircle size={24} className="text-red-600 flex-shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  result.isValid ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.isValid ? '✅ Valid' : '❌ Invalid'}
              </p>
              <p
                className={`text-sm mt-1 ${
                  result.isValid ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>
              {result.hash && (
                <p className="text-xs text-gray-600 mt-2 font-mono break-all">
                  Hash: {formatHash(result.hash, 8)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
