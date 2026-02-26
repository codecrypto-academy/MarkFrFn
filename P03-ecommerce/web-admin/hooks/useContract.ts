'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  getReadProvider, getMainContract, getCompanyRegistryContract,
  getProductCatalogContract, Company, Product, Invoice, unitsToEur,
} from '@/lib/contracts';

export function useMyCompany() {
  const { address } = useWallet();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) { setCompany(null); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const main = getMainContract(getReadProvider());
        const data = await main.getCompanyByAddress(address);
        setCompany(data as unknown as Company);
      } catch {
        setCompany(null); // No tiene empresa registrada
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [address]);

  return { company, loading };
}

export function useCompanyProducts(companyId: bigint | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const main = getMainContract(getReadProvider());
        const data = await main.getCompanyProducts(companyId);
        setProducts(data as unknown as Product[]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [companyId]);

  return { products, loading, refresh: () => {} };
}

export function useCompanyInvoices(companyId: bigint | null) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const main = getMainContract(getReadProvider());
        const ids: bigint[] = await main.getCompanyInvoices(companyId);
        const invs = await Promise.all(ids.map((id) => main.getInvoice(id)));
        setInvoices(invs as unknown as Invoice[]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [companyId]);

  return { invoices, loading };
}

export { unitsToEur };
