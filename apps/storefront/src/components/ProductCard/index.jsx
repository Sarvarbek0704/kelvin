import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../../lib/favorites';
import { formatSom } from '../../lib/money';
import ProductImage from '../ProductImage';
import { TempDots, IconHeart } from '../ui';
import {
  CardWrap,
  ImageBox,
  Badge,
  FavButton,
  Body,
  Footer,
  AddButton,
  NotifyButton,
} from './ProductCard.styled';

/**
 * Mahsulot kartasi (signature) — hamma ro'yxatlarda bir xil.
 *
 * Ma'lumot ikki shakldan keladi (katalog `product` / qidiruv hit), shuning
 * uchun karta normalizatsiya qilingan propslar oladi; hooklar (sevimlilar)
 * ichkarida, savatga qo'shish esa sahifadan `onAdd` orqali.
 */
function ProductCard({
  slug,
  name,
  brand,
  image,
  temps = [],
  price = null,
  oldPrice = null,
  outOfStock = false,
  onAdd,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(slug);

  const priceText = price != null ? formatSom(price).replace(/\s*so'm$/, '') : null;
  const discount =
    oldPrice && price ? Math.round((1 - Number(price) / Number(oldPrice)) * 100) : null;

  return (
    <CardWrap>
      <Link className="cover" to={`/product/${slug}`} aria-label={name} />
      <ImageBox $dim={outOfStock}>
        <ProductImage className="img-frame" image={image} alt={name} sizes="(max-width: 768px) 50vw, 300px" />
        <span className="glow" />
        {outOfStock ? (
          <Badge $tone="oos">Нет в наличии</Badge>
        ) : (
          discount > 0 && <Badge>−{discount}%</Badge>
        )}
        <FavButton
          type="button"
          aria-pressed={fav}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          onClick={() => toggle(slug)}
        >
          <IconHeart size={18} filled={fav} style={{ color: '#B08D57' }} />
        </FavButton>
      </ImageBox>
      <Body $dim={outOfStock}>
        <div className="brand">{brand ?? ''}</div>
        <div className="name">{name}</div>
        <div className="dots">
          <TempDots values={temps} />
        </div>
        {outOfStock ? (
          <>
            <Footer $muted>
              <div className="price">
                {priceText ? (
                  <>
                    {priceText} <span className="unit">so'm</span>
                  </>
                ) : (
                  t('product.price_tbd')
                )}
              </div>
            </Footer>
            <NotifyButton type="button" onClick={() => navigate(`/product/${slug}`)}>
              Сообщить о поступлении
            </NotifyButton>
          </>
        ) : (
          <Footer>
            <div>
              <div className="price">
                {priceText ? (
                  <>
                    {priceText} <span className="unit">so'm</span>
                  </>
                ) : (
                  t('product.price_tbd')
                )}
              </div>
              {oldPrice && <div className="old">{formatSom(oldPrice)}</div>}
            </div>
            <AddButton
              type="button"
              aria-label={t('cart.add')}
              onClick={() => (onAdd ? onAdd() : navigate(`/product/${slug}`))}
            >
              +
            </AddButton>
          </Footer>
        )}
      </Body>
    </CardWrap>
  );
}

export default ProductCard;
