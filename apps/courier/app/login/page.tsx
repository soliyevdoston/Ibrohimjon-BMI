'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function CourierLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhone = `+998${phone.replace(/\D/g, '')}`;

  const startCountdown = () => {
    setCountdown(120);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 9) { setError('Enter valid phone number'); return; }
    setLoading(true); setError('');
    try {
      await api('/auth/otp/request', { method: 'POST', body: { phone: fullPhone, purpose: 'LOGIN' } });
      setStep('otp'); startCountdown();
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== '')) verifyOtp(next.join(''));
  };

  const verifyOtp = async (code: string) => {
    setLoading(true); setError('');
    try {
      const res = await api<{ accessToken: string; user: { role: string; fullName?: string } }>(
        '/auth/otp/verify', { method: 'POST', body: { phone: fullPhone, code } }
      );
      setAuth(res.accessToken, res.user.role ?? 'COURIER', res.user.fullName ?? '');
      router.replace('/dashboard');
    } catch (e) {
      setError((e as Error).message);
      setOtp(['', '', '', '', '', '']); refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)',
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
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Start your shift and earn</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: 24,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
        }}>
          {step === 'phone' ? (
            <div className="stack-sm">
              <h2 style={{ marginBottom: 4 }}>Sign in</h2>
              <p style={{ color: '#5b6576', fontSize: 14, marginBottom: 12 }}>Enter your courier phone number</p>
              <div style={{ display: 'flex' }}>
                <div style={{
                  padding: '12px 14px', background: '#f1f3f7',
                  border: '1px solid var(--border-strong)', borderRight: 'none',
                  borderRadius: '10px 0 0 10px', fontSize: 15, fontWeight: 600, color: '#475569',
                }}>+998</div>
                <input
                  className="input" style={{ borderRadius: '0 10px 10px 0', flex: 1 }}
                  placeholder="90 123 45 67" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                  maxLength={12} inputMode="tel"
                />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
              <button className="btn full" onClick={sendOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Get verification code'}
              </button>
            </div>
          ) : (
            <div className="stack-sm">
              <button onClick={() => { setStep('phone'); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                ← Back
              </button>
              <h2 style={{ marginBottom: 4 }}>Verification code</h2>
              <p style={{ color: '#5b6576', fontSize: 14, marginBottom: 12 }}>Sent to +998{phone}</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                {otp.map((d, i) => (
                  <input key={i} ref={(el) => { refs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                    style={{
                      width: 46, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
                      border: `2px solid ${d ? 'var(--primary)' : 'var(--border-strong)'}`,
                      borderRadius: 12, outline: 'none',
                      background: d ? 'var(--primary-50)' : '#fff', color: 'var(--text)',
                      transition: 'border-color 140ms ease, background 140ms ease',
                    }}
                  />
                ))}
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</p>}
              {loading && <p style={{ color: 'var(--primary)', fontSize: 13, textAlign: 'center' }}>Verifying…</p>}
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                {countdown > 0
                  ? `Resend in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                  : <button onClick={sendOtp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>Resend code</button>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
