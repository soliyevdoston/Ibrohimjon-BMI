'use client';

export type TimelineStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
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
  { id: 'confirmed', label: 'Buyurtma qabul qilindi', icon: '✓' },
  { id: 'preparing', label: 'Sotuvchi tayyorlamoqda', icon: '🍳' },
  { id: 'picked_up', label: 'Kuryer oldi', icon: '📦' },
  { id: 'on_the_way', label: 'Yo\'lda', icon: '🛵' },
  { id: 'delivered', label: 'Yetkazildi', icon: '🎉' },
];

const STATUS_ORDER: TimelineStatus[] = [
  'pending',
  'confirmed',
  'preparing',
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
              ) : state === 'active' ? (
                <span style={{ fontSize: 14 }}>{step.icon}</span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
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
