export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="empty">
      <div style={{ fontSize: 28 }}>◌</div>
      <strong>{title}</strong>
      <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: 360 }}>{description}</p>
    </section>
  );
}
