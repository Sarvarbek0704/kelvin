import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { Container, SectionHead, TextLink } from '../ui';
import { KatalogSection, CategoriesGrid, Tile } from './Katalog.styled';

// Kategoriya rasmi — serverdagi Category.imageUrl (seed /media/categories/<slug>.jpg
// konvensiyasi; fayllar `pnpm media:generate` bilan yaratiladi).
const imageOf = (cat) => cat.imageUrl || `/media/categories/${cat.slug}.jpg`;

/**
 * Bosh sahifa kategoriya mozaikasi — rasm to'liq fon + overlay nom.
 * Birinchi kategoriya 2 ustunli featured plitka; jonli /categories daraxti.
 */
function Katalog() {
  const { t } = useTranslation();
  const { data: tree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories'),
  });
  const roots = Array.isArray(tree) ? tree : [];

  return (
    <KatalogSection>
      <Container>
        <SectionHead
          kicker={t('home.categories_kicker')}
          title={t('home.categories_title')}
          action={
            <TextLink as={Link} to="/catalog">
              {t('common.all_catalog')}
            </TextLink>
          }
        />
        <CategoriesGrid>
          {roots.map((cat, i) => (
            <Tile
              key={cat.id}
              as={Link}
              to={`/search?category=${encodeURIComponent(cat.slug)}`}
              $featured={i === 0}
            >
              <img src={imageOf(cat)} alt="" loading="lazy" />
              <div className="shade" />
              <div className="info">
                <div className="name">{label(cat.name)}</div>
                <div className="more">{t('common.view')}</div>
              </div>
            </Tile>
          ))}
        </CategoriesGrid>
      </Container>
    </KatalogSection>
  );
}

export default Katalog;
