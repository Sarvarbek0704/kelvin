import React from 'react';
import Slide from '../../components/slide';
import Katalog from '../../components/Katalog';
import Reasons from '../../components/reasons';
import Products from '../../components/products';
import Brands from '../../components/brands/Brands';
import Blog from '../../components/blog';

/**
 * Bosh sahifa — dizayn tartibi: hero → kategoriyalar → vitrina → brendlar →
 * nega Kelvin → jurnal. Navbar/Footer RootLayout'da (Outlet orqali).
 */
function Home() {
  return (
    <>
      <Slide />
      <Katalog />
      <Products />
      <Brands />
      <Reasons />
      <Blog />
    </>
  );
}

export default Home;
