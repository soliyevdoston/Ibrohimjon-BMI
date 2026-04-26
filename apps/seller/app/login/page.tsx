'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

type Step = 'phone' | 'otp';

export default function SellerLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhone = `+998${phone.replace(/\D/g, '')}`;

  const startCountdown = () => {
    setCountdown(120);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 9) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      await api('/auth/request-otp', { method: 'POST', body: { phone: fullPhone } });
      setStep('otp');
      startCountdown();
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '')) verifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    setLoading(true); setError('');
    try {
      const res = await api<{ accessToken: string; user: { role: string; fullName?: string } }>(
        '/auth/verify-otp',
        { method: 'POST', body: { phone: fullPhone, code } }
      );
      if (res.user.role !== 'SELLER') {
        setError('This account is not registered as a seller.');
        setOtp(['', '', '', '', '', '']);
        setLoading(false);
        return;
      }
      setAuth(res.accessToken, res.user.role, res.user.fullName ?? '');
      router.replace('/dashboard');
    } catch (e) {
      setError((e as Error).message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 60%, #ecfeff 100%)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
          }}>
            <span style={{ fontSize: 26 }}>🏪</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Seller Portal</h1>
          <p style={{ color: '#5b6576', fontSize: 14 }}>Manage your store and orders</p>
        </div>

        <div className="card" style={{ padding: 32, boxShadow: '0 8px 32px rgba(16,24,40,0.08)' }}>
          {step === 'phone' ? (
            <div className="stack-sm">
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>Sign in</h2>
              <p style={{ color: '#5b6576', fontSize: 14, marginBottom: 16 }}>
                Enter your registered phone number
              </p>
              <label className="label">Phone number</label>
              <div style={{ display: 'flex', gap: 0 }}>
                <div style={{
                  padding: '10px 12px', background: '#f1f3f7',
                  border: '1px solid var(--border-strong)',
                  borderRight: 'none', borderRadius: '10px 0 0 10px',
                  fontSize: 14, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap',
                }}>+998</div>
                <input
                  className="input"
                  style={{ borderRadius: '0 10px 10px 0', flex: 1 }}
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  maxLength={12}
                  inputMode="tel"
                />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{error}</p>}
              <button
                className="btn full"
                style={{ marginTop: 8 }}
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </div>
          ) : (
            <div className="stack-sm">
              <button
                onClick={() => { setStep('phone'); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>Enter verification code</h2>
              <p style={{ color: '#5b6576', fontSize: 14, marginBottom: 16 }}>
                Sent to +998{phone}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    style={{
                      width: 48, height: 52, textAlign: 'center',
                      fontSize: 22, fontWeight: 700,
                      border: `2px solid ${digit ? 'var(--primary)' : 'var(--border-strong)'}`,
                      borderRadius: 12, outline: 'none',
                      background: digit ? 'var(--primary-50)' : '#fff',
                      color: 'var(--text)',
                      transition: 'border-color 140ms ease, background 140ms ease',
                    }}
                  />
                ))}
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</p>}
              {loading && <p style={{ color: 'var(--primary)', fontSize: 13, textAlign: 'center' }}>Verifying…</p>}
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                {countdown > 0 ? (
                  <span>Resend in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
