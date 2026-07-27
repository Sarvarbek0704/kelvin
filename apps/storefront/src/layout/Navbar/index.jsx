import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth-context';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import {
  Container,
  IconSearch,
  IconCart,
  IconHeart,
  IconUser,
  IconMenu,
  IconClose,
} from '../../components/ui';
import {
  Header,
  TopStrip,
  MainRow,
  Wordmark,
  SearchBox,
  Actions,
  CategoryRow,
  IconButton,
  Scrim,
  Drawer,
} from './Navbar.styled';

/**
 * Shapka — ink strip (servis linklar + telefon + RU/UZ), wordmark + qidiruv +
 * ikonlar (mehmon: "Войти" / kirgan: ism), kategoriya qatori. Mobil: hamburger
 * + drawer. Data: savat soni (useCart), user (useAuth), kategoriyalar (/categories).
 */
function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: cart } = useCart();
  const { user } = useAuth();
  const count = cart?.itemCount ?? 0;

  const { data: tree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories'),
  });
  const categories = (Array.isArray(tree) ? tree : []).slice(0, 7);

  const onSearch = (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      setOpen(false);
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    }
  };

  return (
    <Header>
      <TopStrip>
        <Container>
          <div className="inner">
            <div className="links">
              <Link to="/delivery-payment">{t('nav.delivery')}</Link>
              <Link to="/garant">{t('nav.warranty')}</Link>
              <Link to="/contacts">{t('nav.contacts')}</Link>
              <Link to="/blog">{t('nav.blog')}</Link>
            </div>
            <div className="side">
              <a href="tel:+998712004000">+998 (71) 200-40-00</a>
              <LanguageSwitcher />
            </div>
          </div>
        </Container>
      </TopStrip>

      <Container>
        <MainRow>
          <IconButton aria-label="Меню" onClick={() => setOpen(true)}>
            <IconMenu size={24} />
          </IconButton>

          <Wordmark to="/">Kelvin</Wordmark>

          <SearchBox>
            <IconSearch size={18} />
            <input type="text" placeholder={t('search.placeholder')} onKeyDown={onSearch} />
          </SearchBox>

          <Actions>
            {user ? (
              <button className="action" onClick={() => navigate('/account')}>
                <IconUser size={20} />
                <span className="label">{user.firstName ?? t('account.account')}</span>
              </button>
            ) : (
              <button className="action login" onClick={() => navigate('/auth')}>
                <IconUser size={20} />
                <span className="label">{t('account.login')}</span>
              </button>
            )}
            <button
              className="action"
              aria-label={t('nav.favorites')}
              onClick={() => navigate('/favorites')}
            >
              <IconHeart size={22} />
            </button>
            <button
              className="action badge-wrap"
              aria-label={t('nav.basket')}
              onClick={() => navigate('/basket')}
            >
              <IconCart size={22} />
              {count > 0 && <span className="badge">{count}</span>}
            </button>
          </Actions>
        </MainRow>

        <CategoryRow>
          <Link className="catalog" to="/catalog">
            {t('nav.catalog')}
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/search?category=${encodeURIComponent(cat.slug)}`}>
              {label(cat.name)}
            </Link>
          ))}
        </CategoryRow>
      </Container>

      <Scrim $open={open} onClick={() => setOpen(false)} />
      <Drawer $open={open} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="mark">Kelvin</span>
          <button aria-label="Закрыть" onClick={() => setOpen(false)}>
            <IconClose size={22} />
          </button>
        </div>

        <div className="drawer-search">
          <IconSearch size={18} />
          <input type="text" placeholder={t('search.placeholder')} onKeyDown={onSearch} />
        </div>

        <div className="group-label">{t('nav.catalog')}</div>
        <div className="drawer-links">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?category=${encodeURIComponent(cat.slug)}`}
              onClick={() => setOpen(false)}
            >
              {label(cat.name)}
            </Link>
          ))}
          <Link to="/catalog" onClick={() => setOpen(false)}>
            {t('action.allProducts')} →
          </Link>
        </div>

        <div className="group-label">Kelvin</div>
        <div className="drawer-links">
          <Link to="/about-us" onClick={() => setOpen(false)}>{t('nav.about')}</Link>
          <Link to="/delivery-payment" onClick={() => setOpen(false)}>{t('nav.delivery')}</Link>
          <Link to="/return" onClick={() => setOpen(false)}>{t('nav.return')}</Link>
          <Link to="/garant" onClick={() => setOpen(false)}>{t('nav.warranty')}</Link>
          <Link to="/contacts" onClick={() => setOpen(false)}>{t('nav.contacts')}</Link>
          <Link to="/blog" onClick={() => setOpen(false)}>{t('nav.blog')}</Link>
        </div>

        <div className="group-label">{t('account.account')}</div>
        <div className="drawer-links">
          <Link to={user ? '/account' : '/auth'} onClick={() => setOpen(false)}>
            {user ? t('account.account') : t('account.login')}
          </Link>
          <Link to="/favorites" onClick={() => setOpen(false)}>{t('nav.favorites')}</Link>
          <Link to="/orders" onClick={() => setOpen(false)}>{t('orders.title')}</Link>
        </div>

        <div className="drawer-foot">
          <a className="phone" href="tel:+998712004000">
            +998 (71) 200-40-00
          </a>
          <LanguageSwitcher />
        </div>
      </Drawer>
    </Header>
  );
}

export default Navbar;
