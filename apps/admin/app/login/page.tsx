'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (token && role === 'ADMIN') router.replace('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 4) {
      setError('Email va parol kiriting');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api<{ accessToken: string; user: { role: string; fullName?: string } }>(
        '/auth/email/login',
        { method: 'POST', body: { email: email.trim(), password } }
      );
      if (res.user.role !== 'ADMIN') {
        setError('Admin huquqi yo\'q. Faqat admin kirishi mumkin.');
        return;
      }
      localStorage.setItem('access_token', res.accessToken);
      localStorage.setItem('role', res.user.role);
      localStorage.setItem('name', res.user.fullName ?? 'Admin');
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 60%, #e0f2fe 100%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          }}>
            <span style={{ fontSize: 28 }}>⚡</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            Admin Console
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Lochin boshqaruv paneli</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lochin.uz"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Parol
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              color: '#dc2626', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10,
              background: loading ? '#C4B5FD' : '#7C3AED',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>

          <button
            type="button"
            onClick={() => { setEmail('admin@lochin.uz'); setPassword('admin123'); }}
            style={{
              background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 10,
              padding: '10px 0', fontSize: 13, color: '#64748b', cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Demo: admin@lochin.uz / admin123
          </button>
        </form>
      </div>
    </div>
  );
}
