import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import lyustra from '../../assets/lyustra.png';
import { api, label } from '../../lib/api';
import { Button } from '../ui';
import { Hero, HeroText, HeroVisual, HeroCard } from './Slide.styled';

/**
 * Bosh sahifa hero — editorial sarlavha + signature gradient + o'ng panelda
 * iliq nur ostidagi lyustra va real mahsulotga olib boruvchi karta
 * (ommaviy /products ro'yxatining birinchisi — narx TO'QILMAYDI).
 */
function Slide() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/products?limit=8'),
  });
  const featured = data?.items?.[0];

  return (
    <Hero>
      <HeroText>
        <div className="kicker">Салон света · Ташкент</div>
        <h1>
          Свет, подобранный
          <br />
          по температуре
        </h1>
        <p className="lead">
          От тёплых 2700K для спальни до дневных 6500K для мастерской. Кураторская коллекция
          люстр, бра и технического света — как в дизайнерском шоуруме.
        </p>
        <div className="bar" />
        <div className="ctas">
          <Button type="button" onClick={() => navigate('/catalog')}>
            Смотреть каталог
          </Button>
          <Button type="button" $variant="outline" onClick={() => navigate('/search')}>
            Подобрать по комнате
          </Button>
        </div>
      </HeroText>

      <HeroVisual>
        <div className="glow" />
        <img src={lyustra} alt="Сигнатурная люстра Kelvin" />
        {featured && (
          <HeroCard as={Link} to={`/product/${featured.slug}`}>
            {featured.brand && <div className="brand">{featured.brand}</div>}
            <div className="name">{label(featured.name)}</div>
            <div className="more">Смотреть →</div>
          </HeroCard>
        )}
      </HeroVisual>
    </Hero>
  );
}

export default Slide;
