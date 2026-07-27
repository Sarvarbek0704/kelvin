import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { api, label } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import { Container, Crumbs, SectionHead, TextLink } from '../../components/ui';

const Wrap = styled.div`
  padding: 32px 0 64px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
`;

/** Ommabop tovarlar ro'yxati (qisqa vitrina, to'liq filtr /search'da). */
function Products() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/search?perPage=8&sort=popular'),
  });

  const items = data?.items ?? [];

  return (
    <Container>
      <Wrap>
        <Crumbs style={{ marginBottom: 16 }}>
          <Link to="/">Главная</Link>
          <span>/</span>
          <span className="current">Популярные товары</span>
        </Crumbs>

        <SectionHead
          kicker="Витрина"
          title="Популярные товары"
          action={
            <TextLink as={Link} to="/search">
              Весь каталог →
            </TextLink>
          }
        />

        {isLoading && <p>{t('product.loading')}</p>}
        {isError && <p>{t('product.not_found')}</p>}

        <Grid>
          {items.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={label({ ru: p.name_ru, 'uz-Latn': p.name_uz })}
              brand={p.brand}
              image={p.primary_image}
              temps={(p.color_temperature ?? []).slice(0, 3)}
            />
          ))}
        </Grid>
      </Wrap>
    </Container>
  );
}

export default Products;
