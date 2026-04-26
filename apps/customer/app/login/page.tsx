'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

type Step = 'phone' | 'otp';

const OTP_RESEND_DELAY = 120; // seconds

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(OTP_RESEND_DELAY);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatPhone = (raw: string) => {
    return raw.replace(/\D/g, '').slice(0, 9);
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) {
      setError('Telefon raqamini to\'liq kiriting');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api('/auth/request-otp', {
        method: 'POST',
        body: { phone: `+998${digits}` },
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

    if (char && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }

    // Auto-submit when all filled
    if (char && idx === 5) {
      const code = [...next].join('');
      if (code.length === 6) {
        submitOtp([...next]);
      }
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
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
      const res = await api<{ access_token: string; role: string }>(
        '/auth/verify-otp',
        {
          method: 'POST',
          body: { phone: `+998${phone.replace(/\D/g, '')}`, otp: code },
        }
      );
      setAuth(res.access_token, res.role ?? 'customer');
      router.replace('/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Noto\'g\'ri kod');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => submitOtp(otp);

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      await api('/auth/request-otp', {
        method: 'POST',
        body: { phone: `+998${phone.replace(/\D/g, '')}` },
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
    <div style={styles.bg}>
      <div style={styles.card} className="fade-in">
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🛵</div>
          <div style={styles.logoText}>Lochin</div>
          <div style={styles.logoSub}>Tez yetkazib berish xizmati</div>
        </div>

        {step === 'phone' ? (
          <>
            <h2 style={styles.heading}>Kirish</h2>
            <p style={styles.subheading}>
              Telefon raqamingizni kiriting, biz sizga SMS kod yuboramiz
            </p>

            <div className="input-group" style={{ marginTop: 24 }}>
              <label className="label">Telefon raqam</label>
              <div className="input-prefix">
                <span className="input-prefix-label">🇺🇿 +998</span>
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={(e) => {
                    setError('');
                    setPhone(formatPhone(e.target.value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendOtp();
                  }}
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

            <p style={styles.terms}>
              Davom etish orqali siz{' '}
              <a href="#" style={{ color: 'var(--primary)' }}>foydalanish shartlari</a>ga
              rozilik bildirasiz
            </p>
          </>
        ) : (
          <>
            <button
              style={styles.backBtn}
              onClick={() => {
                setStep('phone');
                setOtp(['', '', '', '', '', '']);
                setError('');
              }}
            >
              ← Orqaga
            </button>

            <h2 style={styles.heading}>SMS kodni kiriting</h2>
            <p style={styles.subheading}>
              +998 {phone.slice(0, 2)} {phone.slice(2, 5)} {phone.slice(5, 7)} {phone.slice(7, 9)} raqamiga 6 xonali kod yuborildi
            </p>

            <div style={{ marginTop: 28 }}>
              <div
                className="otp-group"
                onPaste={handleOtpPaste}
              >
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
                <p style={{ textAlign: 'center', marginTop: 12 }} className="error-text">
                  {error}
                </p>
              )}
            </div>

            <button
              className="btn btn-full"
              style={{ marginTop: 28, height: 52 }}
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
            </button>

            <div style={styles.resendArea}>
              {countdown > 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Qayta yuborish: <strong style={{ color: 'var(--primary)' }}>{formatCountdown(countdown)}</strong>
                </span>
              ) : (
                <button
                  style={styles.resendBtn}
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

const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(135deg, #f0f0ff 0%, #faf7ff 50%, #f0f7ff 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 16px 60px rgba(79,70,229,.12)',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 28,
    gap: 4,
  },
  logoIcon: {
    fontSize: 48,
    lineHeight: 1,
    marginBottom: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: '#4f46e5',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 500,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  terms: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 1.6,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  resendArea: {
    marginTop: 20,
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
};
