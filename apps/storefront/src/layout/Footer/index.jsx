import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, label } from '../../lib/api';
import { Container } from '../../components/ui';
import {
  FooterWrap,
  FooterGrid,
  BrandCol,
  FooterCol,
  PayChips,
  Socials,
  BottomBar,
} from './Footer.styled';

/**
 * Futer — to'q guruch (#1B1712), tepasida 4px signature gradient, 4 ustun:
 * brend/manzil · Каталог (jonli kategoriyalar) · Информация · Оплата/soc.
 */
function Footer() {
  const { data: tree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories'),
  });
  const categories = (Array.isArray(tree) ? tree : []).slice(0, 6);

  return (
    <FooterWrap>
      <div className="edge" />
      <Container>
        <FooterGrid>
          <BrandCol>
            <div className="mark">Kelvin</div>
            <div className="tagline">Салон света</div>
            <div className="details">
              Ташкент, ул. Амира Темура, 42
              <br />
              Ежедневно 10:00 — 20:00
              <br />
              <a href="tel:+998712004000">+998 (71) 200-40-00</a>
            </div>
          </BrandCol>

          <FooterCol>
            <div className="head">Каталог</div>
            <div className="links">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/search?category=${encodeURIComponent(cat.slug)}`}>
                  {label(cat.name)}
                </Link>
              ))}
              <Link to="/catalog">Все категории</Link>
            </div>
          </FooterCol>

          <FooterCol>
            <div className="head">Информация</div>
            <div className="links">
              <Link to="/about-us">О компании</Link>
              <Link to="/delivery-payment">Доставка и оплата</Link>
              <Link to="/return">Возврат</Link>
              <Link to="/garant">Гарантии</Link>
              <Link to="/blog">Блог</Link>
              <Link to="/contacts">Контакты</Link>
            </div>
          </FooterCol>

          <FooterCol>
            <div className="head">Оплата</div>
            <PayChips>
              <span className="strong">Click</span>
              <span className="strong">Payme</span>
              <span>Наличные</span>
            </PayChips>
            <div className="head">Соцсети</div>
            <Socials>
              <a href="https://t.me/kelvin_uz" aria-label="Telegram" target="_blank" rel="noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 4 2.5 11.5l6 2 1.5 6 3-4 5 3.5L22 4Z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/kelvin_uz"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <rect x="4" y="4" width="16" height="16" rx="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </a>
            </Socials>
          </FooterCol>
        </FooterGrid>
      </Container>

      <BottomBar>
        <Container>
          <div className="inner">
            <span>© 2026 Kelvin. Все права защищены.</span>
            <span>Ташкент · Узбекистан</span>
          </div>
        </Container>
      </BottomBar>
    </FooterWrap>
  );
}

export default Footer;
