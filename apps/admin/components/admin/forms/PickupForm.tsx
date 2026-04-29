'use client';
import { useState } from 'react';
import { Modal, FormField, TextInput, Select } from '../Modal';
import { MiniMapPicker } from '../MiniMapPicker';
import type { PickupPoint } from '@/lib/admin-store';
import { genId } from '@/lib/admin-store';

const TASHKENT_DISTRICTS = [
  'Yunusobod', 'Chilonzor', "Mirzo Ulug'bek", 'Sergeli', 'Olmazor',
  'Yashnobod', 'Shayxontohur', 'Yakkasaroy', 'Mirobod', 'Bektemir', 'Uchtepa',
];

export function PickupForm({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: PickupPoint | null;
  onSave: (p: PickupPoint) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [district, setDistrict] = useState(initial?.district ?? TASHKENT_DISTRICTS[0]);
  const [pos, setPos] = useState<[number, number] | null>(
    initial ? [initial.lat, initial.lng] : null
  );
  const [hours, setHours] = useState(initial?.hours ?? '10:00 — 22:00');
  const [type, setType] = useState<PickupPoint['type']>(initial?.type ?? 'mall');

  const valid = name.trim() && address.trim() && pos !== null;

  const handleSave = () => {
    if (!valid || !pos) return;
    const point: PickupPoint = {
      id: initial?.id ?? genId('pp'),
      name: name.trim(),
      address: address.trim(),
      district,
      lat: pos[0], lng: pos[1],
      hours, type,
    };
    onSave(point);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Punktni tahrirlash' : 'Yangi tarqatish punkti'}
      subtitle={initial ? initial.name : 'Olib ketish punkti ma\'lumotlarini kiriting'}
      size="lg"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
          <button className="btn" onClick={handleSave} disabled={!valid}>
            {initial ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <FormField label="Punkt nomi" required>
            <TextInput value={name} onChange={setName} placeholder="Tashkent City Mall" />
          </FormField>

          <FormField label="Manzil" required>
            <TextInput value={address} onChange={setAddress} placeholder="Islom Karimov shoh ko'chasi 1" />
          </FormField>

          <FormField label="Tuman" required>
            <Select
              value={district}
              onChange={setDistrict}
              options={TASHKENT_DISTRICTS.map((d) => ({ value: d, label: d }))}
            />
          </FormField>

          <FormField label="Ish vaqti">
            <TextInput value={hours} onChange={setHours} placeholder="10:00 — 22:00" />
          </FormField>

          <FormField label="Turi">
            <Select
              value={type}
              onChange={(v) => setType(v as PickupPoint['type'])}
              options={[
                { value: 'mall',   label: '🛍 Savdo markazi' },
                { value: 'store',  label: '🏪 Do\'kon' },
                { value: 'kiosk',  label: '🏷 Kiosk' },
                { value: 'locker', label: '📦 Locker (24/7)' },
              ]}
            />
          </FormField>
        </div>

        <div>
          <FormField label="Joylashuv" required hint="Xaritaga bosib punkt joyini tanlang">
            <MiniMapPicker value={pos} onChange={(lat, lng) => setPos([lat, lng])} height={400} />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
