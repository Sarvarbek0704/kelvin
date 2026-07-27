import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { Container, SectionHead, TextLink } from '../ui';
import { KatalogSection, CategoriesGrid, Tile } from './Katalog.styled';

import katalog1 from '../../assets/katalog1.png';
import katalog2 from '../../assets/katalog2.png';
import katalog3 from '../../assets/katalog3.png';
import katalog4 from '../../assets/katalog4.png';
import katalog5 from '../../assets/katalog5.png';
import katalog6 from '../../assets/katalog6.png';
import katalog7 from '../../assets/katalog7.png';
import katalog8 from '../../assets/katalog8.png';
import katalog9 from '../../assets/katalog9.png';
import katalog10 from '../../assets/katalog10.png';
import katalog11 from '../../assets/katalog11.png';

// Kategoriya rasmlari indeks bo'yicha (bezak) — nom/slug serverdan.
const IMAGES = [
  katalog1,
  katalog2,
  katalog3,
  katalog4,
  katalog5,
  katalog6,
  katalog7,
  katalog8,
  katalog9,
  katalog10,
  katalog11,
];

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
              <img src={IMAGES[i % IMAGES.length]} alt="" loading="lazy" />
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
