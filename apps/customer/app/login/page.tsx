'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

type Step = 'phone' | 'otp';

const OTP_RESEND_DELAY = 120;

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const redirectTo = searchParams.get('redirect') ?? '/home';

  const startCountdown = useCallback(() => {
    setCountdown(OTP_RESEND_DELAY);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatPhone = (raw: string) => raw.replace(/\D/g, '').slice(0, 9);

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) { setError("Telefon raqamini to'liq kiriting"); return; }
    setError('');
    setLoading(true);
    try {
      await api('/auth/otp/request', {
        method: 'POST',
        body: { phone: `+998${digits}`, purpose: 'LOGIN' },
      });
      setStep('otp');
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = char;
    setOtp(next);
    setError('');
    if (char && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (char && idx === 5) {
      const code = [...next].join('');
      if (code.length === 6) submitOtp([...next]);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted.length) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? '';
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) submitOtp(next);
  };

  const submitOtp = async (digits: string[]) => {
    const code = digits.join('');
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string; user: { role: string; fullName?: string } }>(
        '/auth/otp/verify',
        { method: 'POST', body: { phone: `+998${phone.replace(/\D/g, '')}`, code } }
      );
      setAuth(res.accessToken, res.user?.role ?? 'CUSTOMER');
      router.replace(redirectTo);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noto'g'ri kod");
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      await api('/auth/otp/request', {
        method: 'POST',
        body: { phone: `+998${phone.replace(/\D/g, '')}`, purpose: 'LOGIN' },
      });
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xato yuz berdi');
    } finally {
      setLoading(false);
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
      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: '36px 32px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, gap: 6 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'var(--text)', color: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4,
          }}>
            L
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Lochin</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Tez yetkazib berish xizmati
          </div>
        </div>

        {step === 'phone' ? (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Kirish</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              Telefon raqamingizni kiriting, biz sizga SMS kod yuboramiz
            </p>

            <div className="input-group">
              <label className="label">Telefon raqam</label>
              <div className="input-prefix">
                <span className="input-prefix-label">+998</span>
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={(e) => { setError(''); setPhone(formatPhone(e.target.value)); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
                  maxLength={9}
                  autoFocus
                />
              </div>
              {error && <span className="error-text">{error}</span>}
            </div>

            <button
              className="btn btn-full"
              style={{ marginTop: 24, height: 52 }}
              onClick={handleSendOtp}
              disabled={loading || phone.replace(/\D/g, '').length !== 9}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Yuborilmoqda…' : 'Kod yuborish'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              Davom etish orqali siz{' '}
              <a href="#" style={{ color: 'var(--text)', textDecoration: 'underline' }}>foydalanish shartlari</a>ga
              rozilik bildirasiz
            </p>
          </>
        ) : (
          <>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
            >
              ← Orqaga
            </button>

            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>SMS kodni kiriting</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
              +998 {phone.slice(0, 2)} {phone.slice(2, 5)} {phone.slice(5, 7)} {phone.slice(7, 9)} raqamiga 6 xonali kod yuborildi
            </p>

            <div onPaste={handleOtpPaste}>
              <div className="otp-group">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    className={`otp-input${digit ? ' filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>
              {error && (
                <p style={{ textAlign: 'center', marginTop: 12 }} className="error-text">{error}</p>
              )}
            </div>

            <button
              className="btn btn-full"
              style={{ marginTop: 28, height: 52 }}
              onClick={() => submitOtp(otp)}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {countdown > 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Qayta yuborish:{' '}
                  <strong style={{ color: 'var(--text)' }}>{formatCountdown(countdown)}</strong>
                </span>
              ) : (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  onClick={handleResend}
                  disabled={loading}
                >
                  Kodni qayta yuborish
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
