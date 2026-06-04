'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function SellerLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setError('Email va parol (6+ belgi) kiriting');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await api<{ accessToken: string; user: { role: string; fullName?: string } }>(
        '/auth/email/login',
        { method: 'POST', body: { email: trimmedEmail, password } },
      );
      if (res.user.role !== 'SELLER') {
        setError("Bu akkaunt sotuvchi emas. Sotuvchi email bilan kiring.");
        return;
      }
      setAuth(res.accessToken, res.user.role, res.user.fullName ?? '');
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  };

  const fillDemo = () => {
    setEmail('seller@lochin.uz');
    setPassword('seller123');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 60%, #ecfeff 100%)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
          }}>
            <span style={{ fontSize: 26 }}>🏪</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Seller Portal</h1>
          <p style={{ color: '#5b6576', fontSize: 14 }}>Do&apos;koningiz va buyurtmalar</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 32, boxShadow: '0 8px 32px rgba(16,24,40,0.08)' }}>
          <div className="stack-sm">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="seller@lochin.uz"
              value={email}
              onChange={(e) => { setError(''); setEmail(e.target.value); }}
              autoFocus
              autoComplete="email"
            />

            <label className="label" style={{ marginTop: 6 }}>Parol</label>
            <input
              className="input"
              type="password"
              placeholder="Kamida 6 ta belgi"
              value={password}
              onChange={(e) => { setError(''); setPassword(e.target.value); }}
              autoComplete="current-password"
            />

            {error && <p style={{ color: 'var(--danger, #ef4444)', fontSize: 13, marginTop: 4 }}>{error}</p>}

            <button
              type="submit"
              className="btn full"
              style={{ marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Yuborilmoqda…' : 'Kirish'}
            </button>
          </div>

          <div style={{
            marginTop: 18, padding: '12px 14px',
            background: '#f9fafb', border: '1px dashed #e5e7eb',
            borderRadius: 12, fontSize: 12, color: '#374151',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Demo kirish</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: '#6b7280' }}>
              seller@lochin.uz / seller123
            </div>
            <button
              type="button"
              onClick={fillDemo}
              style={{
                marginTop: 8, border: 'none',
                background: '#111', color: '#fff',
                padding: '6px 12px', borderRadius: 8,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >Demo to&apos;ldirish</button>
          </div>
        </form>
      </div>
    </div>
  );
}
