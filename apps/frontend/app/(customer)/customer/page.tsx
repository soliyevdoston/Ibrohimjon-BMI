'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { api, money } from '@/lib/api';
import { debounce } from '@/lib/debounce';
import { useCartStore } from '@/stores/cart-store';

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  sellerId: string;
};

export default function CustomerHomePage() {
  const { add } = useCartStore();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await api<{ items: Product[] }>(`/products?search=${encodeURIComponent(query)}`);
      setProducts(response.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        loadProducts(value);
      }, 350),
    [],
  );

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <section className="stack fade-in">
      <header className="card" style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Find what you need</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Fresh catalog with instant cart updates</p>

        <div className="grid-3">
          <input
            className="input"
            placeholder="Search products"
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              debouncedSearch(value);
            }}
          />
          <select className="select" defaultValue="">
            <option value="">All categories</option>
            <option value="food">Food</option>
            <option value="grocery">Grocery</option>
            <option value="home">Home</option>
          </select>
          <input className="input" type="number" placeholder="Max price" min={0} />
        </div>
      </header>

      {loading ? (
        <div className="grid-3">
          <Skeleton height={150} />
          <Skeleton height={150} />
          <Skeleton height={150} />
        </div>
      ) : null}

      {!loading && error ? (
        <EmptyState
          title="Could not load products"
          description={`${error}. Check connection and try again.`}
        />
      ) : null}

      {!loading && !error && products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try another search term or clear filters to see all available products."
        />
      ) : null}

      {!loading && !error && products.length > 0 ? (
        <div className="grid-3">
          {products.map((product) => (
            <article key={product.id} className="card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{product.title}</strong>
                <span className="badge">In stock: {product.stock}</span>
              </div>

              <p style={{ margin: 0, color: 'var(--text-secondary)', minHeight: 40 }}>
                {product.description || 'No description'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>{money(Number(product.price))} so'm</strong>
                <button
                  className="btn"
                  onClick={() =>
                    add({
                      productId: product.id,
                      title: product.title,
                      price: Number(product.price),
                      quantity: 1,
                      sellerId: product.sellerId,
                    })
                  }
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
