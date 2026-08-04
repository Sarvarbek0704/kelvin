import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth-context';
import { Button, Input, FieldLabel, FieldError } from '../../components/ui';
import { AuthScreen, AuthAside, AuthFormSide, TabToggle } from './Auth.styled';

/* Ko'z ikonkasi — parolni ko'rsatish/yashirish */
const EyeIcon = ({ off }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.6" />
    {off && <path d="m4 4 16 16" />}
  </svg>
);

/**
 * Kirish / ro'yxatdan o'tish — ALOHIDA to'liq ekran (RootLayout'siz).
 *
 * Kirish: email+parol. Ro'yxatdan o'tish: email+parol → email'ga 6 xonali
 * tasdiqlash kodi → kod kiritilgach hisob faollashadi va kiradi.
 */
function Auth() {
  const { t } = useTranslation();
  const { user, ready, login, register, verifyRegister, resendOtp, forgotPassword, resetPassword } =
    useAuth();
  const navigate = useNavigate();

  // 'login' | 'register' | 'verify' (ro'yxat kodi) | 'forgot' (email) | 'reset' (kod+yangi parol)
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', code: '' });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const switchMode = (m) => {
    setMode(m);
    setErr(null);
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (busy) return; // ikki marta yuborishdan himoya
    setErr(null);
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/basket');
    } catch (e2) {
      setErr(e2?.status === 401 ? t('account.bad_credentials') : e2?.problem?.detail || e2?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        ...(form.firstName.trim() && { firstName: form.firstName.trim() }),
      });
      setForm((f) => ({ ...f, code: '' }));
      setMode('verify');
    } catch (e2) {
      setErr(
        e2?.status === 409
          ? t('account.email_taken')
          : e2?.status === 429
            ? t('account.otp_rate_limited')
            : e2?.problem?.detail || e2?.message || 'Xatolik',
      );
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await verifyRegister(form.email.trim(), form.code.trim());
      navigate('/basket');
    } catch (e2) {
      setErr(e2?.status === 401 ? t('account.otp_invalid') : e2?.problem?.detail || e2?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    setErr(null);
    try {
      await resendOtp(form.email.trim());
    } catch (e2) {
      setErr(e2?.status === 429 ? t('account.otp_rate_limited') : e2?.problem?.detail || 'Xatolik');
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await forgotPassword(form.email.trim());
      setForm((f) => ({ ...f, code: '', password: '' }));
      setMode('reset');
    } catch (e2) {
      setErr(e2?.status === 429 ? t('account.otp_rate_limited') : e2?.problem?.detail || e2?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await resetPassword(form.email.trim(), form.code.trim(), form.password);
      navigate('/account');
    } catch (e2) {
      setErr(e2?.status === 401 ? t('account.otp_invalid') : e2?.problem?.detail || e2?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  // Allaqachon kirgan — profilga
  if (ready && user) {
    return <Navigate to="/account" replace />;
  }

  return (
    <AuthScreen>
      <AuthAside>
        <div className="glow" />
        <Link className="mark" to="/">
          Kelvin
        </Link>
        <div className="pitch">
          <div className="title">
            {t('account.pitch_title_1')}
            <br />
            {t('account.pitch_title_2')}
          </div>
          <div className="text">{t('account.pitch_text')}</div>
        </div>
        <div className="bar" />
      </AuthAside>

      <AuthFormSide>
        <button type="button" className="exit" onClick={() => navigate('/')}>
          ← {t('common.to_home')}
        </button>

        <div className="form-col">
          {(mode === 'login' || mode === 'register') && (
            <TabToggle role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => switchMode('login')}
              >
                {t('account.login')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => switchMode('register')}
              >
                {t('account.register')}
              </button>
            </TabToggle>
          )}

          <h1>
            {mode === 'login'
              ? t('account.welcome_back')
              : mode === 'register'
                ? t('account.welcome')
                : mode === 'verify'
                  ? t('account.code')
                  : t('account.reset_title')}
          </h1>

          {mode === 'login' && (
            <form onSubmit={submitLogin}>
              <div>
                <FieldLabel htmlFor="acc-email">{t('account.email')}</FieldLabel>
                <Input
                  id="acc-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder={t('account.email_ph')}
                  required
                  $error={Boolean(err)}
                />
              </div>

              <div className="pass-wrap">
                <FieldLabel htmlFor="acc-pass">{t('account.password')}</FieldLabel>
                <Input
                  id="acc-pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                  $error={Boolean(err)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label={showPass ? t('account.hide_password') : t('account.show_password')}
                  onClick={() => setShowPass((s) => !s)}
                >
                  <EyeIcon off={showPass} />
                </button>
              </div>

              {err && <FieldError role="alert">{err}</FieldError>}

              <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {t('account.login')}
              </Button>

              <button type="button" className="forgot" onClick={() => switchMode('forgot')}>
                {t('account.forgot')}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={submitRegister}>
              <div>
                <FieldLabel htmlFor="reg-name">{t('account.first_name')}</FieldLabel>
                <Input
                  id="reg-name"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder={t('account.name_ph')}
                />
              </div>
              <div>
                <FieldLabel htmlFor="reg-email">{t('account.email')}</FieldLabel>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder={t('account.email_ph')}
                  required
                  $error={Boolean(err)}
                />
              </div>

              <div className="pass-wrap">
                <FieldLabel htmlFor="reg-pass">{t('account.password')}</FieldLabel>
                <Input
                  id="reg-pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                  $error={Boolean(err)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label={showPass ? t('account.hide_password') : t('account.show_password')}
                  onClick={() => setShowPass((s) => !s)}
                >
                  <EyeIcon off={showPass} />
                </button>
              </div>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}
              >
                <input type="checkbox" required style={{ accentColor: '#B08D57' }} />
                {t('account.terms')}
              </label>

              {err && <FieldError role="alert">{err}</FieldError>}

              <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {t('account.register')}
              </Button>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={submitVerify}>
              <p style={{ fontSize: 14, color: '#8a8177', margin: 0 }}>
                {t('account.code_sent', { email: form.email.trim() })}
              </p>

              <div>
                <FieldLabel htmlFor="ver-code">{t('account.code')}</FieldLabel>
                <Input
                  id="ver-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                  }
                  placeholder="123456"
                  pattern="\d{6}"
                  required
                  $error={Boolean(err)}
                />
              </div>

              {err && <FieldError role="alert">{err}</FieldError>}

              <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {t('account.confirm')}
              </Button>

              <button type="button" className="forgot" onClick={resend} disabled={busy}>
                {t('account.resend')}
              </button>
              <button type="button" className="forgot" onClick={() => switchMode('register')}>
                ← {t('account.register')}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={submitForgot}>
              <p style={{ fontSize: 14, color: '#8a8177', margin: 0 }}>{t('account.forgot_hint')}</p>
              <div>
                <FieldLabel htmlFor="fg-email">{t('account.email')}</FieldLabel>
                <Input
                  id="fg-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder={t('account.email_ph')}
                  required
                  $error={Boolean(err)}
                />
              </div>
              {err && <FieldError role="alert">{err}</FieldError>}
              <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {t('account.confirm')}
              </Button>
              <button type="button" className="forgot" onClick={() => switchMode('login')}>
                ← {t('account.login')}
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={submitReset}>
              <p style={{ fontSize: 14, color: '#8a8177', margin: 0 }}>
                {t('account.code_sent', { email: form.email.trim() })}
              </p>
              <div>
                <FieldLabel htmlFor="rs-code">{t('account.code')}</FieldLabel>
                <Input
                  id="rs-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                  }
                  placeholder="123456"
                  pattern="\d{6}"
                  required
                  $error={Boolean(err)}
                />
              </div>
              <div className="pass-wrap">
                <FieldLabel htmlFor="rs-pass">{t('account.new_password')}</FieldLabel>
                <Input
                  id="rs-pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                  $error={Boolean(err)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label={showPass ? t('account.hide_password') : t('account.show_password')}
                  onClick={() => setShowPass((s) => !s)}
                >
                  <EyeIcon off={showPass} />
                </button>
              </div>
              {err && <FieldError role="alert">{err}</FieldError>}
              <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {t('account.confirm')}
              </Button>
              <button
                type="button"
                className="forgot"
                onClick={() => forgotPassword(form.email.trim()).catch(() => {})}
                disabled={busy}
              >
                {t('account.resend')}
              </button>
            </form>
          )}
        </div>
      </AuthFormSide>
    </AuthScreen>
  );
}

export default Auth;
