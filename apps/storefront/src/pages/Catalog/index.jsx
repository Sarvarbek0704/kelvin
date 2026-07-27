import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { Container, Kicker } from '../../components/ui';
import { CatalogHead, Mosaic, MosaicTile } from './Catalog.styled';

import cat1 from '../../assets/katalog1.png';
import cat2 from '../../assets/katalog2.png';
import cat3 from '../../assets/katalog3.png';
import cat4 from '../../assets/katalog4.png';
import cat5 from '../../assets/katalog5.png';
import cat6 from '../../assets/katalog6.png';
import cat7 from '../../assets/katalog7.png';
import cat8 from '../../assets/katalog8.png';
import cat9 from '../../assets/katalog9.png';
import cat10 from '../../assets/katalog10.png';
import cat11 from '../../assets/katalog11.png';

// Kategoriya rasmlari indeks bo'yicha (bezak) — nom/slug serverdan keladi.
const IMAGES = [cat1, cat2, cat3, cat4, cat5, cat6, cat7, cat8, cat9, cat10, cat11];

// Mozaika ritmi: 1-plitka featured (3×2), keyingi ikkitasi keng (3), qolgani 2.
const spanFor = (i) => (i === 0 ? 3 : i <= 2 ? 3 : 2);

/**
 * Katalog — editorial kategoriya galereyasi (jonli /categories daraxti).
 * Har plitka qidiruvga kategoriya filtri bilan olib boradi.
 */
function Catalog() {
  const { t } = useTranslation();
  const { data: tree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories'),
  });

  const roots = Array.isArray(tree) ? tree : [];

  return (
    <Container>
      <CatalogHead>
        <Kicker as="div">{t('nav.catalog')}</Kicker>
        <h1>{t('catalog.title')}</h1>
        <div className="bar" />
      </CatalogHead>

      <Mosaic>
        {roots.map((cat, i) => (
          <MosaicTile
            key={cat.id}
            as={Link}
            to={`/search?category=${encodeURIComponent(cat.slug)}`}
            $span={spanFor(i)}
            $tall={i === 0}
            $featured={i === 0}
          >
            <div className="bg">
              <img src={IMAGES[i % IMAGES.length]} alt="" loading="lazy" />
            </div>
            <div className="glow" />
            <div className="shade" />
            <div className="info">
              <div className="name">{label(cat.name)}</div>
              {i === 0 && <span className="more">{t('common.view_category')}</span>}
            </div>
          </MosaicTile>
        ))}
      </Mosaic>
    </Container>
  );
}

export default Catalog;
