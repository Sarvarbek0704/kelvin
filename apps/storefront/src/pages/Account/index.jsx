import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth-context';
import { Container } from '../../components/ui';
import { ProfileGrid, ProfileNav, ProfileCards } from './Account.styled';

/**
 * Kabinet (profil) — faqat kirgan foydalanuvchi uchun. Mehmon alohida
 * to'liq ekranli /auth sahifasiga yo'naltiriladi (navbar/footersiz).
 */
function Account() {
  const { t } = useTranslation();
  const { user, ready, logout } = useAuth();

  if (ready && !user) {
    return <Navigate to="/auth" replace />;
  }
  if (!user) return null; // refresh hali tekshirilmoqda

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
          <ProfileCards>
            <div className="card">
              <div className="cap">{t('account.first_name')}</div>
              <div className="val">{user.firstName || '—'}</div>
            </div>
            <div className="card">
              <div className="cap">{t('account.phone')}</div>
              <div className="val">{user.phone || '—'}</div>
            </div>
            <div className="card">
              <div className="cap">Email</div>
              <div className="val">{user.email || '—'}</div>
            </div>
            <div className="card">
              <div className="cap">{t('account.role')}</div>
              <div className="val">{user.roles?.join(', ') || '—'}</div>
            </div>
          </ProfileCards>
        </div>
      </ProfileGrid>
    </Container>
  );
}

export default Account;
