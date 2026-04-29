'use client';
import { useState } from 'react';
import { Modal, FormField, TextInput, NumberInput, Select } from '../Modal';
import type { MockCourier, Branch } from '@/lib/admin-store';
import { genId } from '@/lib/admin-store';

type Courier = MockCourier & { branchId?: string };

const VEHICLES = ['Scooter', 'Motorbike', 'Bicycle', 'Car'] as const;

export function CourierForm({
  open,
  onClose,
  initial,
  branches,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Courier | null;
  branches: Branch[];
  onSave: (c: Courier) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '+998 ');
  const [vehicle, setVehicle] = useState(initial?.vehicle ?? 'Scooter');
  const [branchId, setBranchId] = useState(initial?.branchId ?? branches[0]?.id ?? '');
  const [zone, setZone] = useState(initial?.zone ?? '');
  const [rating, setRating] = useState(initial?.rating ?? 5.0);
  const [isOnline, setIsOnline] = useState(initial?.isOnline ?? true);

  const valid = name.trim() && phone.trim().length > 5 && branchId;

  const handleSave = () => {
    if (!valid) return;
    const branch = branches.find((b) => b.id === branchId);
    const courier: Courier = {
      id: initial?.id ?? genId('c'),
      name: name.trim(),
      phone: phone.trim(),
      vehicle,
      isOnline,
      isBusy: initial?.isBusy ?? false,
      rating,
      deliveriesToday: initial?.deliveriesToday ?? 0,
      zone: zone || branch?.district || '',
      branchId,
    };
    onSave(courier);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Kuryerni tahrirlash' : 'Yangi kuryer qo\'shish'}
      subtitle={initial ? initial.name : 'Kuryer ma\'lumotlarini kiriting'}
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
      <FormField label="Ism Familiya" required>
        <TextInput value={name} onChange={setName} placeholder="Jasur Tursunov" />
      </FormField>

      <FormField label="Telefon" required>
        <TextInput value={phone} onChange={setPhone} placeholder="+998 90 123-45-67" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Transport" required>
          <Select
            value={vehicle}
            onChange={setVehicle}
            options={VEHICLES.map((v) => ({ value: v, label: v }))}
          />
        </FormField>
        <FormField label="Reyting">
          <NumberInput value={rating} onChange={setRating} min={0} />
        </FormField>
      </div>

      <FormField label="Filial" required hint="Kuryer qaysi filialga biriktirilgan">
        <Select
          value={branchId}
          onChange={setBranchId}
          options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.district})` }))}
        />
      </FormField>

      <FormField label="Ish zonasi" hint="Bo'sh qoldirilsa, filial tumanidan olinadi">
        <TextInput value={zone} onChange={setZone} placeholder="Chilonzor" />
      </FormField>

      <FormField label="Holat">
        <label className="hstack" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
          <span>Onlayn — buyurtmalarni qabul qilishi mumkin</span>
        </label>
      </FormField>
    </Modal>
  );
}
