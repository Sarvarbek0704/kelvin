import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth-context';
import {
  Container,
  Button,
  Input,
  FieldLabel,
  FieldError,
} from '../../components/ui';
import {
  AuthGrid,
  AuthAside,
  AuthForm,
  TabToggle,
  ProfileGrid,
  ProfileNav,
  ProfileCards,
} from './Account.styled';

function Account() {
  const { t } = useTranslation();
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ identifier: '', phone: '', password: '', firstName: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
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

  // ---------- Kirgan foydalanuvchi: profil ----------
  if (user) {
    const displayName = user.firstName || user.phone || user.email || t('account.account');
    const initial = String(displayName).trim().charAt(0).toUpperCase() || 'K';
    return (
      <Container>
        <ProfileGrid>
          <ProfileNav>
            <div className="who">
              <div className="avatar">{initial}</div>
              <div>
                <div className="name">{displayName}</div>
                <div className="contact">{user.phone || user.email || ''}</div>
              </div>
            </div>
            <div className="nav">
              <button type="button" className="active">
                Профиль
              </button>
              <Link to="/orders">{t('account.my_orders')}</Link>
              <Link to="/favorites">{t('nav.favorites')}</Link>
              <button type="button" className="muted" onClick={() => logout()}>
                {t('account.logout')}
              </button>
            </div>
          </ProfileNav>

          <div>
            <h1>Профиль</h1>
            <ProfileCards>
              <div className="card">
                <div className="cap">{t('account.first_name')}</div>
                <div className="val">{user.firstName || '—'}</div>
              </div>
              <div className="card">
                <div className="cap">Телефон</div>
                <div className="val">{user.phone || '—'}</div>
              </div>
              <div className="card">
                <div className="cap">Email</div>
                <div className="val">{user.email || '—'}</div>
              </div>
              <div className="card">
                <div className="cap">Роль</div>
                <div className="val">{user.roles?.join(', ') || '—'}</div>
              </div>
            </ProfileCards>
          </div>
        </ProfileGrid>
      </Container>
    );
  }

  // ---------- Mehmon: kirish / ro'yxatdan o'tish ----------
  return (
    <Container>
      <AuthGrid>
        <AuthAside>
          <div className="glow" />
          <div className="mark">Kelvin</div>
          <div className="pitch">
            <div className="title">
              Ваш свет —
              <br />
              под рукой
            </div>
            <div className="text">
              Сохраняйте избранное, следите за заказами и получайте персональные подборки по
              температуре.
            </div>
          </div>
          <div className="bar" />
        </AuthAside>

        <AuthForm>
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

          <h1>{mode === 'login' ? 'С возвращением' : 'Добро пожаловать'}</h1>

          <form onSubmit={submit}>
            {mode === 'login' ? (
              <div>
                <FieldLabel htmlFor="acc-id">{t('account.identifier')}</FieldLabel>
                <Input
                  id="acc-id"
                  type="text"
                  value={form.identifier}
                  onChange={set('identifier')}
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <FieldLabel htmlFor="acc-name">{t('account.first_name')}</FieldLabel>
                  <Input
                    id="acc-name"
                    type="text"
                    value={form.firstName}
                    onChange={set('firstName')}
                    placeholder="Ваше имя"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="acc-phone">Телефон</FieldLabel>
                  <Input
                    id="acc-phone"
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+998901234567"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <FieldLabel htmlFor="acc-pass">{t('account.password')}</FieldLabel>
              <Input
                id="acc-pass"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
              />
            </div>

            {mode === 'register' && (
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}
              >
                <input type="checkbox" required defaultChecked style={{ accentColor: '#B08D57' }} />
                Согласен с условиями и политикой
              </label>
            )}

            {err && <FieldError>{err}</FieldError>}

            <Button type="submit" disabled={busy} style={{ marginTop: 4 }}>
              {mode === 'login' ? t('account.login') : t('account.register')}
            </Button>
          </form>
        </AuthForm>
      </AuthGrid>
    </Container>
  );
}

export default Account;
