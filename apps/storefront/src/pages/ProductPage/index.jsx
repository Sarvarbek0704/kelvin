import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { useCartMutations } from '../../lib/cart';
import { useFavorites } from '../../lib/favorites';
import ProductImage from '../../components/ProductImage';
import ProductReviews from '../../components/ProductReviews';
import ProductQa from '../../components/ProductQa';
import { useSeo } from '../../lib/seo';
import { useReviewSummary } from '../../lib/reviews';
import {
  Container,
  Crumbs,
  Button,
  Rating,
  Stepper,
  TempSelector,
  Hairline,
  Skeleton,
  IconHeart,
  IconTruck,
} from '../../components/ui';
import {
  TopGrid,
  Gallery,
  BuyPanel,
  AxisPills,
  BuyRow,
  DeliveryNote,
  InfoGrid,
  SpecTable,
  SocialSection,
  StickyBuyBar,
} from './ProductPage.styled';

const AXIS_LABELS = { color: 'Цвет', bulb_count: 'Количество ламп', size: 'Размер' };

// Harorat tavsiflari (Design System dagi stops)
const TEMP_DESC = {
  2700: 'тёплый',
  3000: 'мягкий тёплый',
  4000: 'нейтральный',
  5000: 'холодный',
  6500: 'дневной',
};

function ProductPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  });

  const [selected, setSelected] = useState({});
  const [selectedTemp, setSelectedTemp] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const { add } = useCartMutations();
  const { isFavorite, toggle } = useFavorites();
  const { data: reviewSummary } = useReviewSummary(product?.id);

  // ⚠️ SEO hook har renderda (shartsiz) — mahsulot yo'q bo'lsa bo'sh.
  useSeo(
    product
      ? {
          title: label(product.name),
          description: `${label(product.name)}${product.brand ? ` — ${product.brand}` : ''}`,
          image: product.media?.[0]?.url,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: label(product.name),
            ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
            ...(reviewSummary?.count
              ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: reviewSummary.average, reviewCount: reviewSummary.count } }
              : {}),
          },
        }
      : {},
  );

  if (isLoading) {
    return (
      <Container>
        <TopGrid>
          <Skeleton $h="0" style={{ aspectRatio: '4 / 5', height: 'auto' }} $r="14px" />
          <div>
            <Skeleton $w="30%" $h="12px" style={{ marginBottom: 14 }} />
            <Skeleton $w="70%" $h="40px" style={{ marginBottom: 20 }} />
            <Skeleton $w="50%" $h="16px" style={{ marginBottom: 30 }} />
            <Skeleton $w="100%" $h="52px" $r="10px" />
          </div>
        </TopGrid>
      </Container>
    );
  }
  if (isError || !product) {
    return (
      <Container>
        <p style={{ padding: '48px 0' }}>{t('product.not_found')}</p>
      </Container>
    );
  }

  const variants = product.variants ?? [];
  const media = product.media ?? [];

  // O'q qiymatlari (variant tanlash uchun)
  const axes = {};
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.axisValues ?? {})) {
      axes[k] = axes[k] ?? new Set();
      axes[k].add(val);
    }
  }

  // Harorat variantlari (signature selektor)
  const temps = [...new Set(variants.map((v) => v.colorTemperature).filter(Boolean))].sort(
    (a, b) => a - b,
  );

  // Tanlangan o'qlar + haroratga mos variant
  const activeVariant =
    variants.find(
      (v) =>
        Object.entries(selected).every(([k, val]) => (v.axisValues ?? {})[k] === val) &&
        (selectedTemp === null || v.colorTemperature === selectedTemp),
    ) ??
    variants.find((v) =>
      Object.entries(selected).every(([k, val]) => (v.axisValues ?? {})[k] === val),
    ) ??
    variants[0] ??
    null;

  const shownTemp = selectedTemp ?? activeVariant?.colorTemperature ?? null;
  const fav = isFavorite(product.slug);
  const categoryName = product.category ? label(product.category.name) : 'Каталог';

  // Xususiyatlar jadvali — faqat mavjud qiymatlar (hech narsa to'qilmaydi)
  const specs = activeVariant
    ? [
        [t('product.sku'), activeVariant.sku],
        activeVariant.colorTemperature && [t('search.facet_temp'), `${activeVariant.colorTemperature}K`],
        activeVariant.socketType && [t('search.facet_socket'), activeVariant.socketType],
        activeVariant.ipRating && [t('search.facet_ip'), activeVariant.ipRating],
        activeVariant.luminousFlux && [
          t('search.facet_flux'),
          `${Number(activeVariant.luminousFlux).toLocaleString('ru-RU')} lm`,
        ],
        activeVariant.power && [t('product.power'), `${Number(activeVariant.power)} W`],
        activeVariant.cri && ['CRI', `≥ ${activeVariant.cri}`],
        activeVariant.voltage && [t('search.facet_voltage'), `${activeVariant.voltage} V`],
        activeVariant.lightSource && [t('search.facet_light'), activeVariant.lightSource],
        [t('search.dimmable'), activeVariant.dimmable ? t('product.yes') : t('product.no')],
        product.isFragile && [t('product.special'), t('product.fragile_full')],
      ].filter(Boolean)
    : [];

  const description = label(product.description);

  const addToCart = () => {
    if (activeVariant) add.mutate({ variantId: activeVariant.id, quantity: qty });
  };

  return (
    <>
      <Container>
        <Crumbs style={{ paddingTop: 24 }}>
          <Link to="/">{t('common.home')}</Link>
          <span>/</span>
          <Link to="/catalog">{t('nav.catalog')}</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/search?category=${encodeURIComponent(product.category.slug)}`}>
                {categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="current">{label(product.name)}</span>
        </Crumbs>

        <TopGrid>
          <Gallery>
            {media.length > 1 && (
              <div className="rail">
                {media.map((m, i) => (
                  <button
                    key={m.id ?? i}
                    type="button"
                    className={`thumb${i === imgIdx ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Фото ${i + 1}`}
                  >
                    <ProductImage className="t" image={m} alt="" sizes="76px" placeholder="" />
                  </button>
                ))}
              </div>
            )}
            <div className="main-box main">
              <ProductImage
                className="frame"
                image={media[imgIdx] ?? media[0]}
                alt={label(media[imgIdx]?.alt) || label(product.name)}
                sizes="(max-width: 768px) 100vw, 560px"
                placeholder="— главное фото товара —"
              />
              <div className="glow" />
              {media.length > 1 && (
                <div className="dots">
                  {media.map((m, i) => (
                    <button
                      key={m.id ?? i}
                      type="button"
                      className={i === imgIdx ? 'active' : ''}
                      onClick={() => setImgIdx(i)}
                      aria-label={`Фото ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Gallery>

          <BuyPanel>
            {product.brand && <div className="brand">{product.brand}</div>}
            <h1>{label(product.name)}</h1>

            {reviewSummary?.count > 0 && (
              <div className="meta-row">
                <Rating value={reviewSummary.average} size={18} />
                <span className="score">{reviewSummary.average.toFixed(1)}</span>
                <span className="muted">
                  · {reviewSummary.count} {t('product.reviews_suffix')}
                </span>
              </div>
            )}

            {activeVariant && (
              <div className="sku-line">
                {t('product.sku')}: {activeVariant.sku}
              </div>
            )}

            {temps.length > 0 && (
              <div className="sel-block">
                <div className="sel-label">
                  <span className="cap">{t('product.temp_label')}</span>
                  {shownTemp && (
                    <span className="val">
                      {shownTemp}K{TEMP_DESC[shownTemp] ? ` · ${TEMP_DESC[shownTemp]}` : ''}
                    </span>
                  )}
                </div>
                <TempSelector
                  values={temps}
                  value={shownTemp}
                  onChange={setSelectedTemp}
                  size={44}
                  gap={10}
                  showLabels={false}
                />
              </div>
            )}

            {Object.entries(axes).map(([axisKey, values]) => (
              <div className="sel-block" key={axisKey}>
                <div className="sel-label">
                  <span className="cap">{AXIS_LABELS[axisKey] ?? axisKey}</span>
                </div>
                <AxisPills>
                  {[...values].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={selected[axisKey] === val ? 'active' : ''}
                      onClick={() => setSelected((s) => ({ ...s, [axisKey]: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </AxisPills>
              </div>
            ))}

            {activeVariant && (
              <BuyRow $fav={fav}>
                <Stepper
                  value={qty}
                  onDec={() => setQty((q) => Math.max(1, q - 1))}
                  onInc={() => setQty((q) => q + 1)}
                />
                <Button type="button" className="add" disabled={add.isPending} onClick={addToCart}>
                  {add.isSuccess ? '✓ ' : ''}
                  {t('cart.add')}
                </Button>
                <button
                  type="button"
                  className="fav"
                  aria-pressed={fav}
                  aria-label={fav ? 'В избранном' : 'В избранное'}
                  onClick={() => toggle(product.slug)}
                >
                  <IconHeart size={20} filled={fav} />
                </button>
              </BuyRow>
            )}

            <DeliveryNote>
              <IconTruck size={22} style={{ flex: 'none' }} />
              <div>
                <div className="title">{t('product.delivery_title')}</div>
                <div className="sub">
                  {t('product.delivery_sub')}
                  {product.isFragile && ` · ${t('product.fragile_note')}`}
                </div>
              </div>
            </DeliveryNote>
          </BuyPanel>
        </TopGrid>

        <InfoGrid>
          <div>
            <h2>{t('product.specs')}</h2>
            <Hairline style={{ margin: '14px 0 22px' }} />
            <SpecTable>
              {specs.map(([k, v]) => (
                <div className="row" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </SpecTable>
          </div>
          {description && (
            <div>
              <h2>{t('product.description')}</h2>
              <Hairline style={{ margin: '14px 0 22px' }} />
              <p className="desc">{description}</p>
            </div>
          )}
        </InfoGrid>
      </Container>

      <SocialSection>
        <Container>
          <div className="grid">
            <ProductReviews productId={product.id} />
            <ProductQa productId={product.id} />
          </div>
        </Container>
      </SocialSection>

      {activeVariant && (
        <StickyBuyBar $fav={fav}>
          <button
            type="button"
            className="fav"
            aria-pressed={fav}
            aria-label="В избранное"
            onClick={() => toggle(product.slug)}
          >
            <IconHeart size={20} filled={fav} />
          </button>
          <Button type="button" className="add" disabled={add.isPending} onClick={addToCart}>
            {add.isSuccess ? '✓ ' : ''}
            {t('cart.add')}
          </Button>
        </StickyBuyBar>
      )}
    </>
  );
}

export default ProductPage;
