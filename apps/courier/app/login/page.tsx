'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function CourierLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError('Email va parol (6+ belgi) kiriting');
      return;
    }
    setLoading(true); setError('');
    try {
      const path = mode === 'login' ? '/auth/email/login' : '/auth/email/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : { email: email.trim(), password, fullName: fullName || undefined, role: 'COURIER' };
      const res = await api<{ accessToken: string; user: { role: string; fullName?: string } }>(path, { method: 'POST', body });
      setAuth(res.accessToken, res.user.role ?? 'COURIER', res.user.fullName ?? fullName);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  };

  const fillDemo = () => {
    setEmail('courier@lochin.uz');
    setPassword('courier123');
    setMode('login');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'linear-gradient(160deg, #1a1a00 0%, #3D2C00 40%, #A16207 100%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, color: '#fff' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24, margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'grid', placeItems: 'center', fontSize: 36,
          }}>🛵</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Courier App</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Smenangizni boshlang va daromad oling</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: 24,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: '#f3f4f6', borderRadius: 12, marginBottom: 18,
          }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: mode === 'login' ? '#fff' : 'transparent',
                color: mode === 'login' ? '#111' : '#6b7280',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >Kirish</button>
            <button
              type="button"
              onClick={() => setMode('register')}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: mode === 'register' ? '#fff' : 'transparent',
                color: mode === 'register' ? '#111' : '#6b7280',
                boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >Ro&apos;yxatdan o&apos;tish</button>
          </div>

          <div className="stack-sm">
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 }}>Email</label>
            <input
              type="email"
              placeholder="kuryer@lochin.uz"
              value={email}
              onChange={(e) => { setError(''); setEmail(e.target.value); }}
              autoFocus
              autoComplete="email"
              style={{
                padding: '11px 14px', borderRadius: 12, fontSize: 15,
                border: '1.5px solid #e5e7eb', outline: 'none', width: '100%',
                background: '#fff', color: '#111',
              }}
            />

            {mode === 'register' && (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Ism Familiya</label>
                <input
                  type="text"
                  placeholder="Jasur Tursunov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  style={{
                    padding: '11px 14px', borderRadius: 12, fontSize: 15,
                    border: '1.5px solid #e5e7eb', outline: 'none', width: '100%',
                    background: '#fff', color: '#111',
                  }}
                />
              </>
            )}

            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Parol</label>
            <input
              type="password"
              placeholder="Kamida 6 ta belgi"
              value={password}
              onChange={(e) => { setError(''); setPassword(e.target.value); }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                padding: '11px 14px', borderRadius: 12, fontSize: 15,
                border: '1.5px solid #e5e7eb', outline: 'none', width: '100%',
                background: '#fff', color: '#111',
              }}
            />

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #FACC15, #EAB308)',
                color: '#1a1a00',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 6px 18px rgba(79,70,229,0.35)',
              }}
            >
              {loading ? 'Yuborilmoqda…' : (mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish')}
            </button>
          </div>

          <div style={{
            marginTop: 18, padding: '12px 14px',
            background: '#f9fafb', border: '1px dashed #e5e7eb',
            borderRadius: 12, fontSize: 12, color: '#374151',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Demo akkaunt:</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}>
              courier@lochin.uz<br />courier123
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
            >Demo bilan to&apos;ldirish</button>
          </div>
        </form>
      </div>
    </div>
  );
}
