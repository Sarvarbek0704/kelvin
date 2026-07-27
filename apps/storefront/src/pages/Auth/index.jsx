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
 * Kirish / ro'yxatdan o'tish — ALOHIDA to'liq ekran (RootLayout'siz:
 * navbar/footer yo'q). Kirganlar profilga yo'naltiriladi.
 */
function Auth() {
  const { t } = useTranslation();
  const { user, ready, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ identifier: '', phone: '', password: '', firstName: '' });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return; // ikki marta yuborishdan himoya
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        // ⚠️ Login DTO: `identifier` (telefon YOKI email) + parol
        await login(form.identifier.trim(), form.password);
      } else {
        // ⚠️ Register DTO: `phone` + parol (+ixtiyoriy firstName)
        await register({
          phone: form.phone.trim(),
          password: form.password,
          ...(form.firstName.trim() && { firstName: form.firstName.trim() }),
        });
      }
      navigate('/basket');
    } catch (e2) {
      setErr(e2?.problem?.detail || e2?.message || 'Xatolik');
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
          <TabToggle role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              {t('account.login')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              {t('account.register')}
            </button>
          </TabToggle>

          <h1>{mode === 'login' ? t('account.welcome_back') : t('account.welcome')}</h1>

          <form onSubmit={submit}>
            {mode === 'login' ? (
              <div>
                <FieldLabel htmlFor="acc-id">{t('account.identifier')}</FieldLabel>
                <Input
                  id="acc-id"
                  type="text"
                  autoComplete="username"
                  value={form.identifier}
                  onChange={set('identifier')}
                  placeholder="+998 90 123 45 67"
                  required
                  $error={Boolean(err)}
                />
              </div>
            ) : (
              <>
                <div>
                  <FieldLabel htmlFor="acc-name">{t('account.first_name')}</FieldLabel>
                  <Input
                    id="acc-name"
                    type="text"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={set('firstName')}
                    placeholder={t('account.name_ph')}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="acc-phone">{t('account.phone')}</FieldLabel>
                  <Input
                    id="acc-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+998901234567"
                    pattern="\+998\d{9}"
                    title="+998XXXXXXXXX"
                    required
                    $error={Boolean(err)}
                  />
                </div>
              </>
            )}

            <div className="pass-wrap">
              <FieldLabel htmlFor="acc-pass">{t('account.password')}</FieldLabel>
              <Input
                id="acc-pass"
                type={showPass ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

            {mode === 'register' && (
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}
              >
                <input type="checkbox" required style={{ accentColor: '#B08D57' }} />
                {t('account.terms')}
              </label>
            )}

            {err && <FieldError role="alert">{err}</FieldError>}

            <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
              {mode === 'login' ? t('account.login') : t('account.register')}
            </Button>

            {mode === 'login' && (
              <button type="button" className="forgot" onClick={() => navigate('/contacts')}>
                {t('account.forgot')}
              </button>
            )}
          </form>
        </div>
      </AuthFormSide>
    </AuthScreen>
  );
}

export default Auth;
