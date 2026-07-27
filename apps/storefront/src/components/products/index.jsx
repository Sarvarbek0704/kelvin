import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import ProductCard from '../ProductCard';
import { Container, SectionHead, TextLink } from '../ui';
import { ProductsSection, ProductsGrid } from './Products.styled';

/**
 * "Популярные товары" vitrinasi — real API (/products?limit=8).
 * Narx katalog javobida yo'q — karta "Уточняйте" ko'rsatadi (to'qilmaydi).
 */
function Products() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/products?limit=8'),
  });

  const products = data?.items ?? [];

  return (
    <ProductsSection>
      <Container>
        <SectionHead
          kicker={t('home.popular_kicker')}
          title={t('home.popular_title')}
          action={
            <TextLink as={Link} to="/search">
              {t('action.allProducts')} →
            </TextLink>
          }
        />
        <ProductsGrid>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              name={label(product.name)}
              brand={product.brand}
              image={product.media?.[0]}
            />
          ))}
        </ProductsGrid>
      </Container>
    </ProductsSection>
  );
}

export default Products;
