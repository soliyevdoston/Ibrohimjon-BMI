'use client';
import { useState } from 'react';
import { Modal, FormField, TextInput, Select } from '../Modal';
import type { Category } from '@/lib/admin-store';
import { genId } from '@/lib/admin-store';

const COMMON_ICONS = ['🍔', '🛒', '🥖', '🥤', '💊', '💐', '🥩', '🍎', '🥗', '🍕', '🍣', '🍜', '🍰', '☕', '🧃', '🧴', '👕', '📱', '🎁'];

export function CategoryForm({
  open,
  onClose,
  initial,
  parents,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Category | null;
  parents: Category[];
  onSave: (c: Category) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🍔');
  const [parentId, setParentId] = useState<string>(initial?.parentId ?? '');

  const valid = name.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    const cat: Category = {
      id: initial?.id ?? genId('cat'),
      name: name.trim(),
      icon,
      parentId: parentId || null,
      productCount: initial?.productCount ?? 0,
    };
    onSave(cat);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
      size="sm"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
          <button className="btn" onClick={handleSave} disabled={!valid}>
            {initial ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </>
      }
    >
      <FormField label="Nomi" required>
        <TextInput value={name} onChange={setName} placeholder="Oziq-ovqat" />
      </FormField>

      <FormField label="Belgi (emoji)">
        <div style={{
          padding: 10,
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}>
          {COMMON_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              style={{
                width: 36, height: 36,
                border: 'none',
                borderRadius: 8,
                background: icon === i ? '#eef2ff' : 'transparent',
                cursor: 'pointer',
                fontSize: 20,
                outline: icon === i ? '2px solid #4f46e5' : 'none',
              }}
            >
              {i}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Asosiy kategoriya" hint="Bo'sh — bu asosiy kategoriya bo'ladi">
        <Select
          value={parentId}
          onChange={setParentId}
          options={[
            { value: '', label: '— Asosiy kategoriya —' },
            ...parents
              .filter((p) => p.id !== initial?.id && !p.parentId)
              .map((p) => ({ value: p.id, label: `${p.icon} ${p.name}` })),
          ]}
        />
      </FormField>
    </Modal>
  );
}
