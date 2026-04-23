'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const roleOptions = ['CUSTOMER', 'SELLER', 'COURIER', 'ADMIN'] as const;

export default function LoginPage() {
  const { setAuth } = useAuthStore();

  const [phone, setPhone] = useState('+998901234567');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<(typeof roleOptions)[number]>('CUSTOMER');

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = await api<{ sent: boolean; devCode?: string }>('/auth/otp/request', {
        method: 'POST',
        body: {
          phone,
          purpose: 'LOGIN',
        },
      });
      setStep('verify');
      setMessage(payload.devCode ? `Dev OTP: ${payload.devCode}` : 'OTP sent');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = await api<{
        accessToken: string;
        refreshToken: string;
        user: { role: string };
      }>('/auth/otp/verify', {
        method: 'POST',
        body: { phone, code: otpCode },
      });

      const appliedRole = role || (payload.user.role as (typeof roleOptions)[number]);
      setAuth({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        role: appliedRole,
      });

      document.cookie = `role=${appliedRole}; Path=/; Max-Age=86400`;
      document.cookie = `access_token=${payload.accessToken}; Path=/; Max-Age=86400`;

      window.location.href = `/${appliedRole.toLowerCase()}`;
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <main className="page-shell" style={{ minHeight: '100vh', display: 'grid', alignItems: 'center' }}>
      <section className="card" style={{ maxWidth: 520, marginInline: 'auto' }}>
        <h1 style={{ marginTop: 0 }}>Phone login with OTP</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Secure sign in for customer, seller, courier, and admin.</p>

        {step === 'request' ? (
          <form className="stack" onSubmit={requestOtp}>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof roleOptions)[number])}
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button className="btn" type="submit">
              Send OTP
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={verifyOtp}>
            <input
              className="input"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 4-6 digit OTP"
            />
            <button className="btn" type="submit">
              Verify OTP
            </button>
          </form>
        )}

        {message ? <p style={{ color: 'var(--text-secondary)' }}>{message}</p> : null}

        <p style={{ marginBottom: 0 }}>
          Quick access: <Link href="/customer">Customer</Link>
        </p>
      </section>
    </main>
  );
}
