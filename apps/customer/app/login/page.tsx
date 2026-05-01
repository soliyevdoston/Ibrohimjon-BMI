'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') ?? '/home';

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError('Email va parol (6+ belgi) kiriting');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/email/login' : '/auth/email/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : { email: email.trim(), password, fullName: fullName || undefined, role: 'CUSTOMER' };
      const res = await api<{ accessToken: string; user: { role: string } }>(path, { method: 'POST', body });
      setAuth(res.accessToken, res.user?.role ?? 'CUSTOMER');
      router.replace(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('customer@lochin.uz');
    setPassword('customer123');
    setMode('login');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--bg)',
    }}>
      <form onSubmit={handleSubmit} className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: '36px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, gap: 6 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'var(--text)', color: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4,
          }}>L</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Lochin</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Tez yetkazib berish xizmati
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'var(--surface-2, #f3f4f6)',
          borderRadius: 12,
          marginBottom: 22,
        }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: mode === 'login' ? 'var(--surface, #fff)' : 'transparent',
              color: mode === 'login' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >Kirish</button>
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: mode === 'register' ? 'var(--surface, #fff)' : 'transparent',
              color: mode === 'register' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >Ro&apos;yxatdan o&apos;tish</button>
        </div>

        <div className="input-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="siz@example.com"
            value={email}
            onChange={(e) => { setError(''); setEmail(e.target.value); }}
            autoFocus
            autoComplete="email"
          />
        </div>

        {mode === 'register' && (
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="label">Ism Familiya</label>
            <input
              className="input"
              type="text"
              placeholder="Aziz Karimov"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}

        <div className="input-group" style={{ marginTop: 14 }}>
          <label className="label">Parol</label>
          <input
            className="input"
            type="password"
            placeholder="Kamida 6 ta belgi"
            value={password}
            onChange={(e) => { setError(''); setPassword(e.target.value); }}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {error && <span className="error-text">{error}</span>}
        </div>

        <button
          type="submit"
          className="btn btn-full"
          style={{ marginTop: 24, height: 52 }}
          disabled={loading || !email.trim() || password.length < 6}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Yuborilmoqda…' : (mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish')}
        </button>

        <div style={{
          marginTop: 18,
          padding: '12px 14px',
          background: 'var(--surface-2, #f9fafb)',
          border: '1px dashed var(--border, #e5e7eb)',
          borderRadius: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Demo akkaunt:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}>
            customer@lochin.uz<br />customer123
          </div>
          <button
            type="button"
            onClick={fillDemo}
            style={{
              marginTop: 8,
              border: 'none',
              background: 'var(--text)',
              color: 'var(--surface)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >Demo bilan to&apos;ldirish</button>
        </div>
      </form>
    </div>
  );
}
