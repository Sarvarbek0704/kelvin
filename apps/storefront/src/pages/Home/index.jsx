import React from 'react';
import Slide from '../../components/slide';
import Katalog from '../../components/Katalog';
import Reasons from '../../components/reasons';
import Products from '../../components/products';
import Brands from '../../components/brands/Brands';
import Blog from '../../components/blog';
import { HeroBanners, PromoStrip } from '../../components/Banners';

/**
 * Bosh sahifa — dizayn tartibi: hero → promo-banner → kategoriyalar →
 * vitrina → aksiya chizig'i → brendlar → nega Kelvin → jurnal.
 * Bannerlar admin /banners orqali boshqariladi (HOME_HERO/HOME_STRIP).
 */
function Home() {
  return (
    <>
      <Slide />
      <HeroBanners />
      <Katalog />
      <Products />
      <PromoStrip />
      <Brands />
      <Reasons />
      <Blog />
    </>
  );
}

export default Home;
