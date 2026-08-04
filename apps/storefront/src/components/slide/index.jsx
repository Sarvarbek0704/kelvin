import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { Button, Container } from '../ui';
import { Hero, HeroText, HeroVisual, HeroCard } from './Slide.styled';

/**
 * Bosh sahifa hero — editorial sarlavha + signature gradient + o'ng panelda
 * iliq nur ostidagi lyustra va real mahsulotga olib boruvchi karta
 * (ommaviy /products ro'yxatining birinchisi — narx TO'QILMAYDI).
 */
function Slide() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/products?limit=8'),
  });
  const featured = data?.items?.[0];
  // Hero rasmi — featured mahsulotning asosiy media'si; bo'lmasa banner.
  const heroMedia = featured?.media?.find((m) => m.isPrimary) ?? featured?.media?.[0];
  const heroImage = heroMedia?.url || '/media/banners/home-hero-1.jpg';

  return (
    <Container>
      <Hero>
        <HeroText>
          <div className="kicker">{t('home.kicker')}</div>
          <h1>
            {t('home.hero_title_1')}
            <br />
            {t('home.hero_title_2')}
          </h1>
          <p className="lead">{t('home.hero_lead')}</p>
          <div className="bar" />
          <div className="ctas">
            <Button type="button" onClick={() => navigate('/catalog')}>
              {t('home.cta_catalog')}
            </Button>
            <Button type="button" $variant="outline" onClick={() => navigate('/search')}>
              {t('home.cta_room')}
            </Button>
          </div>
        </HeroText>

        <HeroVisual>
          <div className="glow" />
          <img src={heroImage} alt="Kelvin" />
          {featured && (
            <HeroCard as={Link} to={`/product/${featured.slug}`}>
              {featured.brand && <div className="brand">{featured.brand}</div>}
              <div className="name">{label(featured.name)}</div>
              <div className="more">{t('common.view')}</div>
            </HeroCard>
          )}
        </HeroVisual>
      </Hero>
    </Container>
  );
}

export default Slide;
