'use client';

import { useState } from 'react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useContract } from '@/hooks/useContract';
import { EthersUtils } from '@/utils/ethers';
import { PenTool, Check, AlertCircle } from 'lucide-react';

interface DocumentSignerProps {
  fileHash: string;
  fileName: string;
}

export function DocumentSigner({ fileHash, fileName }: DocumentSignerProps) {
  const { isConnected, currentWallet, signMessage } = useMetaMask();
  const { storeDocument } = useContract();
  const [signature, setSignature] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'signing' | 'storing' | 'success' | 'error'>(
    'idle'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSign = async () => {
    if (!isConnected || !currentWallet) {
      alert('Please connect a wallet first');
      return;
    }

    setLoading(true);
    setStatus('signing');
    setErrorMsg('');

    try {
      // Mostrar alerta de confirmación
      const confirmSign = window.confirm(
        `Sign message with ${currentWallet.name}?\n\nMessage (Hash): ${fileHash}`
      );

      if (!confirmSign) {
        setLoading(false);
        setStatus('idle');
        return;
      }

      const sig = await signMessage(fileHash);
      setSignature(sig);
      setStatus('success');

      console.log('✅ Document signed:', {
        file: fileName,
        hash: fileHash,
        signer: currentWallet.address,
        signature: sig,
      });

      alert(`✅ Signature created!\n\nSignature: ${sig.slice(0, 50)}...`);
    } catch (error) {
      console.error('❌ Error signing:', error);
      setStatus('error');
      setErrorMsg(`Signing failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStore = async () => {
    if (!signature || !isConnected || !currentWallet) {
      alert('Please sign the document first');
      return;
    }

    setLoading(true);
    setStatus('storing');
    setErrorMsg('');

    try {
      const confirmStore = window.confirm(
        `Store document on blockchain?\n\nFile: ${fileName}\nHash: ${fileHash}\nSigner: ${currentWallet.address}\nSignature: ${signature.slice(0, 50)}...`
      );

      if (!confirmStore) {
        setLoading(false);
        setStatus('success');
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const receipt = await storeDocument(fileHash, timestamp, signature);

      // Guardar en localStorage para el historial
      const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
      storedDocs.unshift({
        hash: fileHash,
        timestamp,
        signer: currentWallet.address,
        displayHash: fileHash,
      });
      localStorage.setItem('storedDocuments', JSON.stringify(storedDocs));

      setStatus('success');
      alert(`✅ Document stored!\n\nTx Hash: ${receipt?.hash}`);

      console.log('✅ Document stored on blockchain:', {
        file: fileName,
        hash: fileHash,
        timestamp,
        signer: currentWallet.address,
        tx: receipt?.hash,
      });
    } catch (error) {
      console.error('❌ Error storing:', error);
      setStatus('error');
      setErrorMsg(`Storage failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <PenTool size={24} />
        Sign & Store Document
      </h2>

      {!isConnected && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-amber-800">Please connect a wallet to sign documents</p>
        </div>
      )}

      {fileHash && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">File: {fileName}</p>
          <p className="font-mono text-xs bg-white p-2 rounded border border-gray-300 break-all text-blue-600">
            {fileHash}
          </p>
        </div>
      )}

      {signature && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
            <Check size={18} />
            Document Signed
          </p>
          <p className="font-mono text-xs bg-white p-2 rounded border border-green-300 break-all text-green-700">
            {signature}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Error
          </p>
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSign}
          disabled={!isConnected || loading || (status === 'success' && !!signature)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading && status === 'signing' ? 'Signing...' : 'Sign Document'}
        </button>

        <button
          onClick={handleStore}
          disabled={!signature || loading || !isConnected}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading && status === 'storing' ? 'Storing...' : 'Store on Blockchain'}
        </button>
      </div>
    </div>
  );
}
