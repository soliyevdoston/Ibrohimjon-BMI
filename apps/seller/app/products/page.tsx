'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/Sidebar';
import { SellerTopbar } from '@/components/Topbar';
import { ProductModal } from '@/components/ProductModal';
import { api, money } from '@/lib/api';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  isActive: boolean;
};

const DEMO: Product[] = [
  { id: '1', title: 'Fresh Tomatoes', description: 'Organic red tomatoes from Fergana', price: 18000, stock: 150, categoryId: 'grocery', isActive: true },
  { id: '2', title: 'Uzbek Bread (Non)', description: 'Freshly baked traditional bread', price: 8000, stock: 80, categoryId: 'food', isActive: true },
  { id: '3', title: 'Green Tea 100g', description: 'Premium Uzbek green tea', price: 35000, stock: 60, categoryId: 'food', isActive: true },
  { id: '4', title: 'Pomegranate Juice 1L', description: 'Natural juice, no preservatives', price: 45000, stock: 40, categoryId: 'grocery', isActive: false },
  { id: '5', title: 'Olive Oil 500ml', description: 'Extra virgin olive oil', price: 89000, stock: 25, categoryId: 'grocery', isActive: true },
];

const CATEGORY_LABEL: Record<string, string> = {
  food: 'Food', grocery: 'Grocery', electronics: 'Electronics',
  home: 'Home', beauty: 'Beauty', fashion: 'Fashion', other: 'Other',
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899'];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(DEMO);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; product?: Product } | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api<{ items: Product[] }>(`/products/mine?search=${encodeURIComponent(search)}`, { token });
      setProducts(res.items);
    } catch { /* use demo */ } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    loadProducts();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api(`/products/${id}`, { method: 'DELETE', token });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) { alert((e as Error).message); }
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="app-shell">
      <SellerSidebar />
      <div className="app-main">
        <SellerTopbar title="Products" subtitle="Manage your catalog" />
        <main className="app-content fade-in">
          <div className="stack">
            {/* Toolbar */}
            <div className="hstack">
              <input
                className="input"
                style={{ maxWidth: 280 }}
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              <div className="spacer" />
              <button className="btn" onClick={() => setModal({ type: 'create' })}>+ New Product</button>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j}><div className="skeleton" style={{ height: 20, width: j === 0 ? 180 : 80 }} /></td>
                          ))}
                        </tr>
                      ))
                    ) : paged.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                          No products found
                        </td>
                      </tr>
                    ) : paged.map((p, idx) => (
                      <tr key={p.id}>
                        <td>
                          <div className="tcell-primary">
                            <div style={{
                              width: 40, height: 40, borderRadius: 10, flex: 'none',
                              background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : COLORS[idx % COLORS.length],
                              display: 'grid', placeItems: 'center', fontSize: 18,
                            }}>
                              {!p.imageUrl && '📦'}
                            </div>
                            <div>
                              <strong>{p.title}</strong>
                              <div className="muted" style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.description || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{CATEGORY_LABEL[p.categoryId] ?? p.categoryId}</td>
                        <td><strong>{money(p.price)} so'm</strong></td>
                        <td>
                          <span style={{ color: p.stock < 10 ? 'var(--danger)' : p.stock < 30 ? 'var(--warning)' : 'inherit', fontWeight: 600 }}>
                            {p.stock}
                          </span>
                        </td>
                        <td>
                          <span className={`chip ${p.isActive ? 'green' : 'gray'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="hstack" style={{ gap: 6 }}>
                            <button className="btn ghost sm" onClick={() => setModal({ type: 'edit', product: p })}>Edit</button>
                            <button className="btn danger sm" onClick={() => handleDelete(p.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="hstack" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', gap: 8 }}>
                  <button className="btn ghost sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                  <button className="btn ghost sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {modal && (
        <ProductModal
          product={modal.product
            ? { ...modal.product, price: String(modal.product.price), stock: String(modal.product.stock), id: modal.product.id, imageUrl: modal.product.imageUrl ?? '' }
            : undefined}
          onClose={() => setModal(null)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}
