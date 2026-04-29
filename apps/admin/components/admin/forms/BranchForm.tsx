'use client';
import { useState } from 'react';
import { Modal, FormField, TextInput, NumberInput, Select } from '../Modal';
import { MiniMapPicker } from '../MiniMapPicker';
import type { Branch } from '@/lib/admin-store';
import { genId } from '@/lib/admin-store';

const TASHKENT_DISTRICTS = [
  'Yunusobod', 'Chilonzor', "Mirzo Ulug'bek", 'Sergeli', 'Olmazor',
  'Yashnobod', 'Shayxontohur', 'Yakkasaroy', 'Mirobod', 'Bektemir', 'Uchtepa',
];

export function BranchForm({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Branch | null;
  onSave: (b: Branch) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [district, setDistrict] = useState(initial?.district ?? TASHKENT_DISTRICTS[0]);
  const [pos, setPos] = useState<[number, number] | null>(
    initial ? [initial.lat, initial.lng] : null
  );
  const [hours, setHours] = useState(initial?.hours ?? '08:00 — 22:00');
  const [couriers, setCouriers] = useState(initial?.couriers ?? 5);
  const [capacity, setCapacity] = useState(initial?.capacity ?? 10);
  const [status, setStatus] = useState<Branch['status']>(initial?.status ?? 'active');
  const [type, setType] = useState<Branch['type']>(initial?.type ?? 'satellite');

  const valid = name.trim() && address.trim() && pos !== null;

  const handleSave = () => {
    if (!valid || !pos) return;
    const branch: Branch = {
      id: initial?.id ?? genId('br'),
      name: name.trim(),
      address: address.trim(),
      district,
      lat: pos[0], lng: pos[1],
      hours,
      couriers, capacity,
      status, type,
    };
    onSave(branch);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Filialni tahrirlash' : 'Yangi filial qo\'shish'}
      subtitle={initial ? initial.name : 'Filial ma\'lumotlarini kiriting va xaritada joyni tanlang'}
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
          <FormField label="Filial nomi" required>
            <TextInput value={name} onChange={setName} placeholder="Lochin Markaziy ombor" />
          </FormField>

          <FormField label="Manzil" required>
            <TextInput value={address} onChange={setAddress} placeholder="Amir Temur ko'chasi 107A" />
          </FormField>

          <FormField label="Tuman" required>
            <Select
              value={district}
              onChange={setDistrict}
              options={TASHKENT_DISTRICTS.map((d) => ({ value: d, label: d }))}
            />
          </FormField>

          <FormField label="Ish vaqti">
            <TextInput value={hours} onChange={setHours} placeholder="08:00 — 22:00" />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Kuryerlar">
              <NumberInput value={couriers} onChange={setCouriers} min={0} />
            </FormField>
            <FormField label="Sig'imi">
              <NumberInput value={capacity} onChange={setCapacity} min={1} />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Holat">
              <Select
                value={status}
                onChange={(v) => setStatus(v as Branch['status'])}
                options={[
                  { value: 'active', label: '🟢 Faol' },
                  { value: 'busy',   label: '🟡 Band' },
                  { value: 'closed', label: '⚫ Yopiq' },
                ]}
              />
            </FormField>
            <FormField label="Turi">
              <Select
                value={type}
                onChange={(v) => setType(v as Branch['type'])}
                options={[
                  { value: 'main',      label: '🏢 Asosiy' },
                  { value: 'satellite', label: '🏬 Yordamchi' },
                ]}
              />
            </FormField>
          </div>
        </div>

        <div>
          <FormField label="Joylashuv" required hint="Xaritaga bosib filial joyini tanlang">
            <MiniMapPicker value={pos} onChange={(lat, lng) => setPos([lat, lng])} height={400} />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
