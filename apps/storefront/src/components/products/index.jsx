import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, label } from '../../lib/api';
import ProductCard from '../ProductCard';
import { Container, SectionHead, TextLink } from '../ui';
import { ProductsSection, ProductsGrid } from './Products.styled';

/**
 * "Популярные товары" vitrinasi — real API (/products?limit=8).
 * Narx katalog javobida yo'q — karta "Уточняйте" ko'rsatadi (to'qilmaydi).
 */
function Products() {
  const { data } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => api.get('/products?limit=8'),
  });

  const products = data?.items ?? [];

  return (
    <ProductsSection>
      <Container>
        <SectionHead
          kicker="Витрина"
          title="Популярные товары"
          action={
            <TextLink as={Link} to="/search">
              Все товары →
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
