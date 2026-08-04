import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Container, Button, Input, FieldLabel, FieldError } from '../../components/ui';
import { ProfileGrid, ProfileNav, ProfileCards } from './Account.styled';

/**
 * Kabinet (profil) — faqat kirgan foydalanuvchi uchun. Ma'lumot serverdan
 * (/customers/me); ism/familiya/telefon shu yerda tahrirlanadi. Mehmon
 * alohida to'liq ekranli /auth sahifasiga yo'naltiriladi.
 */
function Account() {
  const { t } = useTranslation();
  const { user, ready, logout } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/customers/me'),
    enabled: Boolean(user),
  });

  // form faqat foydalanuvchi TAHRIRLARINI saqlaydi; ko'rsatishda profil bilan
  // birlashadi (effect'da setState kerak emas).
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null); // {ok: bool, text}
  const [busy, setBusy] = useState(false);

  const value = (key) => form[key] ?? profile?.[key] ?? '';

  if (ready && !user) {
    return <Navigate to="/auth" replace />;
  }
  if (!user) return null; // refresh hali tekshirilmoqda

  const displayName = profile?.firstName || profile?.email || t('account.account');
  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'K';

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    setMsg(null);
    setBusy(true);
    try {
      await api.patch('/customers/me', {
        firstName: String(value('firstName')).trim(),
        lastName: String(value('lastName')).trim(),
        ...(String(value('phone')).trim() && { phone: String(value('phone')).trim() }),
      });
      void qc.invalidateQueries({ queryKey: ['profile'] });
      setForm({});
      setMsg({ ok: true, text: t('account.saved') });
    } catch (e2) {
      setMsg({ ok: false, text: e2?.problem?.detail || e2?.message || 'Xatolik' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container>
      <ProfileGrid>
        <ProfileNav>
          <div className="who">
            <div className="avatar">{initial}</div>
            <div>
              <div className="name">{displayName}</div>
              <div className="contact">{profile?.email || profile?.phone || ''}</div>
            </div>
          </div>
          <div className="nav">
            <button type="button" className="active">
              {t('account.profile')}
            </button>
            <Link to="/orders">{t('account.my_orders')}</Link>
            <Link to="/favorites">{t('nav.favorites')}</Link>
            <button type="button" className="muted" onClick={() => logout()}>
              {t('account.logout')}
            </button>
          </div>
        </ProfileNav>

        <div>
          <h1>{t('account.profile')}</h1>

          <form onSubmit={save}>
            <ProfileCards>
              <div className="card">
                <FieldLabel htmlFor="pf-first">{t('account.first_name')}</FieldLabel>
                <Input
                  id="pf-first"
                  type="text"
                  autoComplete="given-name"
                  value={value('firstName')}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder={t('account.name_ph')}
                />
              </div>
              <div className="card">
                <FieldLabel htmlFor="pf-last">{t('account.last_name')}</FieldLabel>
                <Input
                  id="pf-last"
                  type="text"
                  autoComplete="family-name"
                  value={value('lastName')}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <div className="card">
                <FieldLabel htmlFor="pf-phone">{t('account.phone')}</FieldLabel>
                <Input
                  id="pf-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={value('phone')}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+998901234567"
                  pattern="\+998\d{9}"
                  title="+998XXXXXXXXX"
                />
              </div>
              <div className="card">
                <div className="cap">Email</div>
                <div className="val">{profile?.email || '—'}</div>
              </div>
            </ProfileCards>

            {msg && (
              <FieldError role="status" style={msg.ok ? { color: '#5a7d4a' } : undefined}>
                {msg.text}
              </FieldError>
            )}

            <Button type="submit" disabled={busy} style={{ marginTop: 16 }}>
              {t('account.save')}
            </Button>
          </form>
        </div>
      </ProfileGrid>
    </Container>
  );
}

export default Account;
