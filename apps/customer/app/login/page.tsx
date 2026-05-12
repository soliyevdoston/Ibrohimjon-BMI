'use client';
import { useState, Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

// Google OAuth Client ID public (brauzerda ishlatiladi, sir emas).
// Env qo'yilsa shu, qo'yilmasa hardcoded fallback — shunday qilib tugma
// Vercel'da env sozlanmagan bo'lsa ham ko'rinadi.
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '302395779594-uqamsqdrh3u359gd23pre4pkr8ijai54.apps.googleusercontent.com';

// Google Identity Services minimal types — only what we actually call.
interface GoogleIdConfig {
  client_id: string;
  callback: (response: { credential: string }) => void;
  ux_mode?: 'popup' | 'redirect';
  auto_select?: boolean;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          prompt: () => void;
        };
      };
    };
  }
}

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
  const [googleReady, setGoogleReady] = useState(false);

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

  const handleGoogleCredential = useCallback(async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string; user: { role: string } }>(
        '/auth/google',
        { method: 'POST', body: { idToken } },
      );
      setAuth(res.accessToken, res.user?.role ?? 'CUSTOMER');
      router.replace(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google bilan kirib bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, [redirectTo, router, setAuth]);

  // Google Identity Services'ni initsializatsiya qilamiz. Tugma bosilganda
  // akkaunt tanlash oynasi ochiladi.
  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID) return;
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => handleGoogleCredential(response.credential),
      ux_mode: 'popup',
      auto_select: false,
    });
  }, [googleReady, handleGoogleCredential]);

  const openGoogleChooser = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
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

        {/* Google sign-in. Tugma faqat GOOGLE_CLIENT_ID sozlangan bo'lsa ko'rinadi. */}
        {GOOGLE_CLIENT_ID && (
          <>
            <Script
              src="https://accounts.google.com/gsi/client"
              strategy="afterInteractive"
              onLoad={() => setGoogleReady(true)}
            />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              margin: '20px 0 14px', color: 'var(--text-muted)', fontSize: 12,
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>yoki</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={openGoogleChooser}
              disabled={loading || !googleReady}
              style={{
                width: '100%',
                height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                cursor: googleReady ? 'pointer' : 'wait',
                fontSize: 14, fontWeight: 600, color: 'var(--text)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.1 4 9.2 8.4 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.1 0-9.5-3.3-11.2-7.9l-6.5 5C9 39.5 16 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40 35 44 30 44 24c0-1.3-.1-2.3-.4-3.5z" />
              </svg>
              Google bilan kirish
            </button>
          </>
        )}

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
