import Link from 'next/link';

const roles = [
  { href: '/customer', title: 'Customer Panel', description: 'Browse, checkout, track order' },
  { href: '/seller', title: 'Seller Panel', description: 'Manage products and fulfillment' },
  { href: '/courier', title: 'Courier Panel', description: 'Accept and deliver in real time' },
  { href: '/admin', title: 'Admin Panel', description: 'Observe, assign, and control' },
];

export default function Home() {
  return (
    <main className="page-shell" style={{ minHeight: '100vh', display: 'grid', alignItems: 'center' }}>
      <section className="card fade-in" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Delivery Platform Control Surface</h1>
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          Single codebase. Four role-specific experiences. Real-time fulfillment.
        </p>

        <div className="grid-2" style={{ marginTop: 16 }}>
          {roles.map((role) => (
            <Link key={role.href} href={role.href} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700 }}>{role.title}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{role.description}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
