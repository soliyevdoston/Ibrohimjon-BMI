'use client';

export type TimelineStatus =
  | 'pending'
  | 'confirmed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'courier_accepted'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

type StepState = 'done' | 'active' | 'pending';

type Step = {
  id: string;
  label: string;
  icon: string;
  timestamp?: string;
};

const STEPS: Step[] = [
  { id: 'confirmed', label: 'Buyurtma qabul qilindi', icon: '1' },
  { id: 'preparing', label: 'Ishlab chiqaruvchi tayyorlamoqda', icon: '2' },
  { id: 'picked_up', label: 'Kuryer oldi', icon: '3' },
  { id: 'on_the_way', label: "Yo'lda", icon: '4' },
  { id: 'delivered', label: 'Yetkazildi', icon: '5' },
];

const STATUS_ORDER: TimelineStatus[] = [
  'pending',
  'confirmed',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'courier_accepted',
  'picked_up',
  'on_the_way',
  'delivered',
];

function getStepState(stepId: string, currentStatus: TimelineStatus): StepState {
  if (currentStatus === 'cancelled') return 'pending';

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepId as TimelineStatus);

  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

export function Timeline({
  status,
  timestamps,
}: {
  status: TimelineStatus;
  timestamps?: Partial<Record<string, string>>;
}) {
  return (
    <div className="timeline">
      {STEPS.map((step, idx) => {
        const state = getStepState(step.id, status);
        return (
          <div key={step.id} className={`timeline-step ${state}`}>
            {/* Dot */}
            <div className={`timeline-dot ${state}`}>
              {state === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: state === 'active' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {idx + 1}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="timeline-content">
              <div className="timeline-label">{step.label}</div>
              {timestamps?.[step.id] && (
                <div className="timeline-time">{timestamps[step.id]}</div>
              )}
              {state === 'active' && !timestamps?.[step.id] && (
                <div className="timeline-time" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Hozir…
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
