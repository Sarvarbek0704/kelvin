import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { Container, Kicker } from '../../components/ui';
import { CatalogHead, Mosaic, MosaicTile } from './Catalog.styled';

// Kategoriya rasmi — serverdagi Category.imageUrl (seed /media/categories/<slug>.jpg
// konvensiyasi; fayllar `pnpm media:generate` bilan yaratiladi).
const imageOf = (cat) => cat.imageUrl || `/media/categories/${cat.slug}.jpg`;

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
              <img src={imageOf(cat)} alt="" loading="lazy" />
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
