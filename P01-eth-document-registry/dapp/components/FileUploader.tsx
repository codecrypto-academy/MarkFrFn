'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileCheck } from 'lucide-react';
import { useFileHash } from '@/hooks/useFileHash';

interface FileUploaderProps {
  onFileSelected?: (file: File, hash: string) => void;
  onHashCalculated?: (hash: string) => void;
}

export function FileUploader({ onFileSelected, onHashCalculated }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hashType, setHashType] = useState<'sha256' | 'keccak256'>('keccak256');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { calculateSha256, calculateKeccak256, getFileInfo, formatHash } = useFileHash();

  const processFile = useCallback(
    async (selectedFile: File, type: 'sha256' | 'keccak256') => {
      setFile(selectedFile);
      setLoading(true);
      try {
        const calculatedHash =
          type === 'sha256'
            ? await calculateSha256(selectedFile)
            : await calculateKeccak256(selectedFile);

        setHash(calculatedHash);
        onHashCalculated?.(calculatedHash);
        onFileSelected?.(selectedFile, calculatedHash);

        console.log(`✅ File hashed (${type}):`, {
          name: selectedFile.name,
          size: selectedFile.size,
          hash: calculatedHash,
        });
      } catch (error) {
        alert(`Error calculating hash: ${error}`);
        setFile(null);
        setHash('');
      } finally {
        setLoading(false);
      }
    },
    [calculateSha256, calculateKeccak256, onHashCalculated, onFileSelected]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) processFile(selectedFile, hashType);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile, hashType);
  };

  const handleChangeHashType = (newType: 'sha256' | 'keccak256') => {
    setHashType(newType);
    if (file) processFile(file, newType);
  };

  const fileInfo = file ? getFileInfo(file) : null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer select-none
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
          }
          ${loading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />

        <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-300">
          {isDragging ? (
            <FileCheck size={40} className="text-blue-500 animate-bounce" />
          ) : (
            <Upload size={40} className={loading ? 'animate-spin' : ''} />
          )}
          <span className="text-lg font-semibold">
            {loading ? 'Processing...' : isDragging ? 'Drop to upload!' : 'Click to upload or drag & drop'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Any file type is supported</span>
        </div>
      </div>

      {fileInfo && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-tab-in">
          <h3 className="font-semibold mb-3 dark:text-gray-100">📄 File Information</h3>

          <div className="space-y-2 text-sm dark:text-gray-300">
            <div><span className="text-gray-600 dark:text-gray-400">Name:</span> {fileInfo.name}</div>
            <div><span className="text-gray-600 dark:text-gray-400">Size:</span> {fileInfo.size}</div>
            <div><span className="text-gray-600 dark:text-gray-400">Type:</span> {fileInfo.type || 'unknown'}</div>
          </div>

          <div className="mt-4 pt-4 border-t dark:border-gray-600">
            <div className="flex gap-2 mb-3">
              {(['sha256', 'keccak256'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleChangeHashType(type)}
                  disabled={loading}
                  className={`px-3 py-1 text-sm rounded transition ${
                    hashType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                  } disabled:opacity-50`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            <h4 className="font-semibold text-sm mb-2 dark:text-gray-200">🔐 {hashType.toUpperCase()} Hash:</h4>
            <div className="font-mono text-xs bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-600 break-all text-blue-600 dark:text-blue-400">
              {hash}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatHash(hash, 8)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
