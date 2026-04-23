'use client';

import { FormEvent, useState } from 'react';

export default function SellerProductsPage() {
  const [products, setProducts] = useState([
    { id: '1', title: 'Coffee Beans', price: 78000, stock: 19 },
    { id: '2', title: 'Granola', price: 34000, stock: 54 },
  ]);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title || price <= 0 || stock < 0) {
      return;
    }

    setProducts((current) => [
      { id: String(Date.now()), title, price, stock },
      ...current,
    ]);
    setTitle('');
    setPrice(0);
    setStock(0);
  };

  return (
    <section className="grid-2 fade-in">
      <article className="card stack">
        <h2 style={{ margin: 0 }}>Product management</h2>
        <form className="stack" onSubmit={onSubmit}>
          <input className="input" placeholder="Product name" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" type="number" placeholder="Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          <input className="input" type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          <button className="btn" type="submit">
            Add product
          </button>
        </form>
      </article>

      <article className="card stack">
        <h3 style={{ margin: 0 }}>Inventory list</h3>
        {products.map((item) => (
          <div key={item.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{item.title}</strong>
              <span className="badge">Stock: {item.stock}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>{item.price.toLocaleString()} so'm</div>
          </div>
        ))}
      </article>
    </section>
  );
}
