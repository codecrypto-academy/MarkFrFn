'use client';

/**
 * WalletContext — Gestión del estado de MetaMask.
 *
 * Provee: address, signer, provider, isConnected, connect(), disconnect()
 * El signer se usa para firmar meta-transacciones (EIP-712).
 * El provider (BrowserProvider) se usa para leer estado de la chain.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID } from '@/lib/contracts';

interface WalletState {
  address:     string | null;
  signer:      ethers.Signer | null;
  provider:    ethers.BrowserProvider | null;
  isConnected: boolean;
  isConnecting: boolean;
  error:       string | null;
  connect:     () => Promise<void>;
  disconnect:  () => void;
}

const WalletContext = createContext<WalletState>({
  address: null, signer: null, provider: null,
  isConnected: false, isConnecting: false, error: null,
  connect: async () => {}, disconnect: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,      setAddress]      = useState<string | null>(null);
  const [signer,       setSigner]       = useState<ethers.Signer | null>(null);
  const [provider,     setProvider]     = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask no detectado. Instala la extensión.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send('eth_requestAccounts', []);

      // Verificar red correcta
      const network = await browserProvider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        setError(`Red incorrecta. Conecta a chainId ${CHAIN_ID} (Anvil local).`);
        return;
      }

      const walletSigner = await browserProvider.getSigner();
      const walletAddress = await walletSigner.getAddress();

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAddress(walletAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar wallet';
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setError(null);
  }, []);

  // Reaccionar a cambios de cuenta o red desde MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else if (address && accounts[0].toLowerCase() !== address.toLowerCase()) {
        connect();
      }
    };

    const handleChainChanged = () => {
      // Al cambiar de red reconectar para validar chainId
      if (address) connect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, connect, disconnect]);

  return (
    <WalletContext.Provider value={{
      address, signer, provider,
      isConnected: !!address,
      isConnecting, error,
      connect, disconnect,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
