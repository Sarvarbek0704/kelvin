import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { api, label } from '../../lib/api';
import { useFavorites } from '../../lib/favorites';
import ProductCard from '../../components/ProductCard';
import { Container, Kicker, Hairline, EmptyState, IconHeart } from '../../components/ui';

const Wrap = styled.div`
  padding: 36px 0 64px;

  h1 {
    font-size: 44px;
    margin: 6px 0 0;
  }

  .count {
    font-size: 14px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-top: 6px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 20px 0 40px;

    h1 {
      font-size: 32px;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 28px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 18px;
  }
`;

/**
 * Sevimlilar — brauzerdagi ro'yxat ([[lib/favorites]]). Slug'lar localStorage'da;
 * har mahsulot serverdan yangilanadi (nom/rasm har doim jonli).
 */
function FavoriteCard({ slug }) {
  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  });

  if (!product) return null;
  const temps = [
    ...new Set((product.variants ?? []).map((v) => v.colorTemperature).filter(Boolean)),
  ].sort((a, b) => a - b);

  return (
    <ProductCard
      slug={slug}
      name={label(product.name)}
      brand={product.brand}
      image={product.media?.[0]}
      temps={temps.slice(0, 3)}
    />
  );
}

function Favorites() {
  const navigate = useNavigate();
  const { slugs } = useFavorites();

  return (
    <Container>
      <Wrap>
        <Kicker as="div">Ваша подборка</Kicker>
        <h1>Избранное</h1>
        <div className="count">
          {slugs.length > 0 ? `Сохранено: ${slugs.length}` : ''}
        </div>
        <Hairline style={{ marginTop: 18 }} />

        {slugs.length === 0 ? (
          <EmptyState
            icon={<IconHeart size={30} />}
            title="В избранном пусто"
            text="Нажимайте на сердечко на карточке товара — соберите свою подборку света."
            actionLabel="В каталог"
            onAction={() => navigate('/catalog')}
          />
        ) : (
          <Grid>
            {slugs.map((slug) => (
              <FavoriteCard key={slug} slug={slug} />
            ))}
          </Grid>
        )}
      </Wrap>
    </Container>
  );
}

export default Favorites;
