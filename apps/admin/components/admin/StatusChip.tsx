import { Status, statusChip } from '@/lib/admin-mock';

export function StatusChip({ status }: { status: Status }) {
  const meta = statusChip[status];
  return <span className={`chip ${meta.tone}`}>{meta.label}</span>;
}
