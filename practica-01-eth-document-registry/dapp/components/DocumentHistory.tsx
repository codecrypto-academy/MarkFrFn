'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, FileText, RefreshCw, AlertCircle, Download, Search } from 'lucide-react';
import { useContract } from '@/hooks/useContract';

interface StoredDocument {
  hash: string;
  timestamp: number;
  signer: string;
  signature: string;
}

export function DocumentHistory() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { getDocumentCount, getDocumentHashByIndex, getDocumentInfo } = useContract();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await getDocumentCount();
      const docs: StoredDocument[] = [];

      for (let i = 0; i < count; i++) {
        const hash = await getDocumentHashByIndex(i);
        const info = await getDocumentInfo(hash);
        docs.push({
          hash: info.hash as string,
          timestamp: Number(info.timestamp),
          signer: info.signer as string,
          signature: info.signature as string,
        });
      }

      setDocuments(docs.reverse());
    } catch (err) {
      console.error('❌ Error loading documents:', err);
      setError('No se pudieron cargar los documentos desde la blockchain');
    } finally {
      setLoading(false);
    }
  }, [getDocumentCount, getDocumentHashByIndex, getDocumentInfo]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const formatDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const truncate = (str: string, start = 8, end = 6) =>
    str.length > start + end + 3 ? `${str.slice(0, start)}...${str.slice(-end)}` : str;

  const exportCSV = () => {
    const header = ['Hash', 'Signer', 'Timestamp', 'Date', 'Signature'];
    const rows = documents.map((doc) => [
      doc.hash,
      doc.signer,
      doc.timestamp,
      formatDate(doc.timestamp),
      doc.signature,
    ]);
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-registry-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = searchQuery.trim()
    ? documents.filter(
        (doc) =>
          doc.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.signer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-gray-100">
          <History size={24} />
          Document History
        </h2>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 rounded-lg transition"
            >
              <Download size={16} />
              CSV
            </button>
          )}
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      {!loading && documents.length > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by hash or signer address..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Skeleton loader */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && documents.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-50" />
          <p>No documents stored yet</p>
          <p className="text-sm">Upload and sign a document to see it here</p>
        </div>
      )}

      {/* No search results */}
      {!loading && documents.length > 0 && filtered.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
          No results for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto animate-tab-in">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3 font-semibold dark:text-gray-200">Hash</th>
                <th className="text-left p-3 font-semibold dark:text-gray-200">Signer</th>
                <th className="text-left p-3 font-semibold dark:text-gray-200">Timestamp</th>
                <th className="text-left p-3 font-semibold dark:text-gray-200">Signature</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => (
                <tr
                  key={idx}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-3 font-mono text-blue-600 dark:text-blue-400 text-xs">
                    {truncate(doc.hash, 10, 8)}
                  </td>
                  <td className="p-3 font-mono text-xs dark:text-gray-300">
                    {truncate(doc.signer, 6, 4)}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{formatDate(doc.timestamp)}</td>
                  <td className="p-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {truncate(doc.signature, 10, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-right">
            {filtered.length === documents.length
              ? `${documents.length} document${documents.length !== 1 ? 's' : ''} on-chain`
              : `${filtered.length} of ${documents.length} documents`}
          </p>
        </div>
      )}
    </div>
  );
}
