'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { getReadProvider, getMainContract, getCartContract, Product, CartItem, unitsToEur } from '@/lib/contracts';
import ConnectWallet from '@/components/ConnectWallet';

export default function StorePage() {
  const { address, signer } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchProducts = async () => {
    try {
      const main = getMainContract(getReadProvider());
      const ps = await main.getAllProducts();
      setProducts(ps as unknown as Product[]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!address) return;
    const main = getMainContract(getReadProvider());
    const items = await main.getCart(address);
    setCartItems(items as unknown as CartItem[]);
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (address) fetchCart(); else setCartItems([]); }, [address]);

  const addToCart = async (product: Product) => {
    if (!signer) { setMessage('Conecta MetaMask para agregar al carrito.'); return; }
    setAdding(product.productId.toString());
    setMessage('');
    try {
      const main = getMainContract(getReadProvider());
      const cartAddr: string = await main.shoppingCart();
      const cart = getCartContract(cartAddr, signer);
      const tx = await cart.addToCart(product.productId, BigInt(1));
      await tx.wait();
      await fetchCart();
      setMessage(`✅ "${product.name}" agregado al carrito.`);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setAdding(null);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🛒 Tienda</h1>
          <p className="text-xs text-gray-500">E-Commerce Blockchain</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-sm text-gray-400 hover:text-white transition">Mis pedidos</Link>
          <Link href="/cart" className="relative text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            🛒 Carrito
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <ConnectWallet />
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {message && (
          <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-green-400">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-12">Cargando productos…</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay productos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.productId.toString()} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{p.description}</p>
                  <p className="text-xs text-gray-600 mt-2">Stock: {p.stock.toString()} unidades</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold text-lg">
                    {unitsToEur(p.price).toFixed(2)} EURT
                  </span>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={adding === p.productId.toString() || p.stock === 0n}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                  >
                    {adding === p.productId.toString() ? 'Agregando…' : p.stock === 0n ? 'Sin stock' : '+ Carrito'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
