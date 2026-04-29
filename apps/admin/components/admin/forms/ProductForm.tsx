'use client';
import { useState } from 'react';
import { Modal, FormField, TextInput, NumberInput, Select } from '../Modal';
import type { Product, Category, MockSeller } from '@/lib/admin-store';
import { genId } from '@/lib/admin-store';

export function ProductForm({
  open,
  onClose,
  initial,
  sellers,
  categories,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Product | null;
  sellers: MockSeller[];
  categories: Category[];
  onSave: (p: Product) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [sellerId, setSellerId] = useState(initial?.sellerId ?? sellers[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(initial?.price ?? 10000);
  const [stock, setStock] = useState(initial?.stock ?? 50);
  const [status, setStatus] = useState<Product['status']>(initial?.status ?? 'pending');

  const valid = title.trim() && sellerId && categoryId && price > 0;

  const handleSave = () => {
    if (!valid) return;
    const seller = sellers.find((s) => s.id === sellerId);
    const product: Product = {
      id: initial?.id ?? genId('p'),
      title: title.trim(),
      sellerId,
      sellerName: seller?.brand ?? '',
      categoryId,
      price,
      stock,
      status,
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
    };
    onSave(product);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
      size="md"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
          <button className="btn" onClick={handleSave} disabled={!valid}>
            {initial ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </>
      }
    >
      <FormField label="Mahsulot nomi" required>
        <TextInput value={title} onChange={setTitle} placeholder="Cappuccino 250ml" />
      </FormField>

      <FormField label="Sotuvchi" required>
        <Select
          value={sellerId}
          onChange={setSellerId}
          options={sellers.map((s) => ({ value: s.id, label: s.brand }))}
        />
      </FormField>

      <FormField label="Kategoriya" required>
        <Select
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Narxi (so'm)" required>
          <NumberInput value={price} onChange={setPrice} min={0} />
        </FormField>
        <FormField label="Zaxira">
          <NumberInput value={stock} onChange={setStock} min={0} />
        </FormField>
      </div>

      <FormField label="Holat">
        <Select
          value={status}
          onChange={(v) => setStatus(v as Product['status'])}
          options={[
            { value: 'pending',  label: '⏳ Kutilmoqda' },
            { value: 'approved', label: '✅ Tasdiqlangan' },
            { value: 'rejected', label: '❌ Rad etilgan' },
          ]}
        />
      </FormField>
    </Modal>
  );
}
