'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID } from '@/lib/contracts';

interface WalletState {
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress]         = useState<string | null>(null);
  const [signer, setSigner]           = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) { setError('Instala MetaMask para continuar.'); return; }
    setIsConnecting(true); setError(null);
    try {
      const bp = new ethers.BrowserProvider(window.ethereum);
      await bp.send('eth_requestAccounts', []);
      const network = await bp.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        setError(`Red incorrecta. Conecta a Anvil Local (chainId ${CHAIN_ID}).`); return;
      }
      const s = await bp.getSigner();
      setSigner(s);
      setAddress(await s.getAddress());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al conectar');
    } finally { setIsConnecting(false); }
  }, []);

  const disconnect = useCallback(() => { setAddress(null); setSigner(null); }, []);

  // Auto-conectar silenciosamente al montar si MetaMask ya autorizó el sitio
  useEffect(() => {
    if (!window.ethereum) return;
    (async () => {
      try {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) return;
        const bp = new ethers.BrowserProvider(window.ethereum);
        const network = await bp.getNetwork();
        if (Number(network.chainId) !== CHAIN_ID) return;
        const s = await bp.getSigner();
        setSigner(s);
        setAddress(await s.getAddress());
      } catch { /* silently ignore */ }
    })();
  }, []);

  // Reaccionar a cambios de cuenta en MetaMask
  // NO llamar connect() (usa eth_requestAccounts que puede fallar desde un evento automático)
  // En su lugar reconectar directamente con la nueva cuenta activa
  useEffect(() => {
    if (!window.ethereum) return;
    const h = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        try {
          const bp = new ethers.BrowserProvider(window.ethereum);
          const s = await bp.getSigner();
          setSigner(s);
          setAddress(await s.getAddress());
        } catch {
          disconnect();
        }
      }
    };
    window.ethereum.on('accountsChanged', h);
    return () => window.ethereum.removeListener('accountsChanged', h);
  }, [disconnect]);

  return (
    <WalletContext.Provider value={{ address, signer, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet fuera de WalletProvider');
  return ctx;
}
