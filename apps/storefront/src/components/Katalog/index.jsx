import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, label } from '../../lib/api';
import { Container, SectionHead, TextLink } from '../ui';
import { KatalogSection, CategoriesGrid, Tile, FeaturedTile } from './Katalog.styled';

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
 * Bosh sahifa kategoriya mozaikasi — jonli /categories daraxti; birinchi
 * kategoriya (Люстры) 2 ustunli featured plitka.
 */
function Katalog() {
  const { data: tree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories'),
  });
  const roots = Array.isArray(tree) ? tree : [];
  const [featured, ...rest] = roots;

  return (
    <KatalogSection>
      <Container>
        <SectionHead
          kicker="Каталог"
          title="Категории света"
          action={
            <TextLink as={Link} to="/catalog">
              Весь каталог →
            </TextLink>
          }
        />
        <CategoriesGrid>
          {featured && (
            <FeaturedTile as={Link} to={`/search?category=${encodeURIComponent(featured.slug)}`}>
              <div className="info">
                <div>
                  <div className="name">{label(featured.name)}</div>
                  <div className="sub">Хрусталь, латунь, LED</div>
                </div>
                <span className="more">Смотреть →</span>
              </div>
              <div className="thumb">
                <img src={IMAGES[0]} alt="" loading="lazy" />
              </div>
            </FeaturedTile>
          )}
          {rest.map((cat, i) => (
            <Tile key={cat.id} as={Link} to={`/search?category=${encodeURIComponent(cat.slug)}`}>
              <div className="thumb">
                <img src={IMAGES[(i + 1) % IMAGES.length]} alt="" loading="lazy" />
              </div>
              <div className="body">
                <div className="name">{label(cat.name)}</div>
                <div className="more">Смотреть →</div>
              </div>
            </Tile>
          ))}
        </CategoriesGrid>
      </Container>
    </KatalogSection>
  );
}

export default Katalog;
