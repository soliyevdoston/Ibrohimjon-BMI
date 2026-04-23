const steps = ['Order received', 'Seller preparing', 'Courier picked up', 'On the way', 'Delivered'];

export function Timeline({ currentStep }: { currentStep: number }) {
  return (
    <div className="timeline">
      {steps.map((step, index) => (
        <div key={step} className="timeline-item">
          <span className={`timeline-dot ${index <= currentStep ? 'done' : ''}`} />
          <div>
            <div style={{ fontWeight: 600 }}>{step}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {index <= currentStep ? 'Completed' : 'Waiting'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
