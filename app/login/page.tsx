'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Short exit animation, then into the app
    setLeaving(true);
    setTimeout(() => router.push('/'), 350);
  };

  return (
    <div className="bps-login">
      <style>{`
        .bps-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #eaf5fb 0%, #ffffff 45%, #dcecf7 100%);
          background-size: 200% 200%;
          animation: bpsGradient 14s ease infinite;
          color: #0f172a;
        }
        .bps-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 16px;
          padding: 36px 28px 28px;
          box-shadow: 0 10px 40px rgba(29, 137, 198, 0.15), 0 2px 6px rgba(15, 23, 42, 0.06);
          animation: bpsCardIn 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .bps-card.is-leaving { opacity: 0; transform: translateY(-8px) scale(0.98); }
        .bps-mark {
          width: 56px; height: 56px; margin: 0 auto 14px;
          border: 2px solid #1d89c6; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #1d89c6; font-weight: 700; font-size: 15px; letter-spacing: 0.04em;
          animation: bpsMarkIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s both;
        }
        .bps-title {
          text-align: center; font-size: 22px; font-weight: 700; margin: 0;
          animation: bpsRise 0.5s ease-out 0.2s both;
        }
        .bps-sub {
          text-align: center; font-size: 13px; color: #64748b; margin: 4px 0 24px;
          animation: bpsRise 0.5s ease-out 0.28s both;
        }
        .bps-field { margin-bottom: 16px; animation: bpsRise 0.5s ease-out both; }
        .bps-field:nth-of-type(1) { animation-delay: 0.32s; }
        .bps-field:nth-of-type(2) { animation-delay: 0.38s; }
        .bps-label { display: block; font-size: 13px; font-weight: 500; color: #334155; margin-bottom: 6px; }
        .bps-input {
          width: 100%; box-sizing: border-box; padding: 11px 12px; font-size: 16px;
          border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #0f172a;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .bps-input:focus { border-color: #1d89c6; box-shadow: 0 0 0 3px rgba(29, 137, 198, 0.18); }
        .bps-btn {
          width: 100%; margin-top: 8px; padding: 12px; font-size: 15px; font-weight: 600;
          color: #fff; background: #1d89c6; border: 0; border-radius: 10px; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          transition: background-color 0.2s ease, transform 0.1s ease;
          animation: bpsRise 0.5s ease-out 0.45s both;
        }
        .bps-btn:hover:not(:disabled) { background: #1670a8; }
        .bps-btn:active:not(:disabled) { transform: scale(0.99); }
        .bps-btn:disabled { background: #7fb8d9; cursor: default; }
        .bps-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.5); border-top-color: #fff;
          animation: bpsSpin 0.7s linear infinite;
        }
        .bps-error {
          background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
          padding: 10px 12px; border-radius: 10px; font-size: 14px; margin-bottom: 16px;
          animation: bpsShake 0.4s ease-in-out both;
        }
        .bps-foot {
          text-align: center; font-size: 13px; color: #64748b; margin: 20px 0 0;
          animation: bpsFade 0.6s ease-out 0.55s both;
        }
        @keyframes bpsGradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes bpsCardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes bpsMarkIn { from { opacity: 0; transform: scale(0.6) rotate(-6deg); } to { opacity: 1; transform: none; } }
        @keyframes bpsRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes bpsFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bpsSpin { to { transform: rotate(360deg); } }
        @keyframes bpsShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bps-login, .bps-card, .bps-mark, .bps-title, .bps-sub, .bps-field,
          .bps-btn, .bps-error, .bps-foot, .bps-spinner { animation: none !important; }
          .bps-card { transition: none; }
        }
      `}</style>

      <div className={`bps-card ${leaving ? 'is-leaving' : ''}`}>
        <div className="bps-mark" aria-hidden="true">BPS</div>
        <h1 className="bps-title">Sign in to BPS Pro</h1>
        <p className="bps-sub">Block Property Solutions</p>

        {error && (
          <div className="bps-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="bps-field">
            <label className="bps-label" htmlFor="bps-email">Email</label>
            <input
              id="bps-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bps-input"
              required
            />
          </div>

          <div className="bps-field">
            <label className="bps-label" htmlFor="bps-password">Password</label>
            <input
              id="bps-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bps-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="bps-btn">
            {loading && <span className="bps-spinner" aria-hidden="true" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="bps-foot">Need an account? Contact your administrator</p>
      </div>
    </div>
  );
}
