'use client';
import { useState } from 'react';
import { Modal, FormField, TextInput, NumberInput, Select } from '../Modal';
import { MiniMapPicker } from '../MiniMapPicker';
import type { MockSeller, Category } from '@/lib/admin-store';
import { genId } from '@/lib/admin-store';

type Seller = MockSeller & {
  categoryId?: string;
  lat?: number;
  lng?: number;
  address?: string;
};

export function SellerForm({
  open,
  onClose,
  initial,
  categories,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Seller | null;
  categories: Category[];
  onSave: (s: Seller) => void;
}) {
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [owner, setOwner] = useState(initial?.owner ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '+998 ');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [pos, setPos] = useState<[number, number] | null>(
    initial?.lat != null && initial?.lng != null ? [initial.lat, initial.lng] : null
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [productsCount, setProductsCount] = useState(initial?.productsCount ?? 0);

  const valid = brand.trim() && owner.trim() && phone.trim().length > 5 && pos !== null;

  const handleSave = () => {
    if (!valid || !pos) return;
    const seller: Seller = {
      id: initial?.id ?? genId('s'),
      brand: brand.trim(),
      owner: owner.trim(),
      phone: phone.trim(),
      address: address.trim(),
      categoryId,
      lat: pos[0], lng: pos[1],
      isActive,
      rating: initial?.rating ?? 4.5,
      productsCount,
      ordersToday: initial?.ordersToday ?? 0,
      revenueToday: initial?.revenueToday ?? 0,
    };
    onSave(seller);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Sotuvchini tahrirlash' : 'Yangi sotuvchi onbordingi'}
      subtitle={initial ? initial.brand : "Sotuvchi do'koni ma'lumotlarini kiriting"}
      size="lg"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
          <button className="btn" onClick={handleSave} disabled={!valid}>
            {initial ? 'Saqlash' : 'Onboard qilish'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <FormField label="Brend nomi" required>
            <TextInput value={brand} onChange={setBrand} placeholder="Bro Coffee" />
          </FormField>

          <FormField label="Egasi" required>
            <TextInput value={owner} onChange={setOwner} placeholder="Jamshid Akbarov" />
          </FormField>

          <FormField label="Telefon" required>
            <TextInput value={phone} onChange={setPhone} placeholder="+998 90 101-01-01" />
          </FormField>

          <FormField label="Manzil">
            <TextInput value={address} onChange={setAddress} placeholder="Amir Temur ko'chasi 12" />
          </FormField>

          <FormField label="Kategoriya" required>
            <Select
              value={categoryId}
              onChange={setCategoryId}
              options={categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
            />
          </FormField>

          <FormField label="Mahsulotlar soni">
            <NumberInput value={productsCount} onChange={setProductsCount} min={0} />
          </FormField>

          <FormField label="Holat">
            <label className="hstack" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span>Faol — buyurtmalarni qabul qilishi mumkin</span>
            </label>
          </FormField>
        </div>

        <div>
          <FormField label="Do'kon joyi" required hint="Xaritaga bosib do'kon joyini tanlang">
            <MiniMapPicker value={pos} onChange={(lat, lng) => setPos([lat, lng])} height={460} />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
