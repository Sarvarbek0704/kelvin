import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, label } from '../../lib/api';
import { Button, Container } from '../ui';
import { HeroBannerSection, BannerFrame, StripSection, StripCard } from './Banners.styled';

/** linkUrl ichki yo'l bo'lsa <Link>, tashqi bo'lsa <a>. Yo'q bo'lsa oddiy div. */
function BannerLinkWrap({ linkUrl, className, children }) {
  if (!linkUrl) {
    return <div className={className}>{children}</div>;
  }
  if (linkUrl.startsWith('/')) {
    return (
      <Link to={linkUrl} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={linkUrl} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/**
 * HOME_HERO bannerlar — hero ostidagi aylanadigan promo (admin /banners orqali
 * boshqariladi). Bitta bo'lsa statik, ko'p bo'lsa 6s interval + nuqtalar.
 */
export function HeroBanners() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const { data } = useQuery({
    queryKey: ['banners', 'HOME_HERO'],
    queryFn: () => api.get('/banners?position=HOME_HERO'),
  });
  const banners = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const id = setInterval(() => setActive((a) => (a + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <HeroBannerSection>
      <Container>
        <BannerFrame>
          {banners.map((b, i) => (
            <div key={b.id} className={i === active % banners.length ? 'slide active' : 'slide'}>
              <img src={b.imageUrl} alt={label(b.title)} loading={i === 0 ? 'eager' : 'lazy'} />
              <div className="shade" />
              <div className="content">
                <div className="title">{label(b.title)}</div>
                {b.linkUrl && (
                  <Button as={BannerLinkWrap} linkUrl={b.linkUrl}>
                    {t('common.view')}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <div className="dots">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Banner ${String(i + 1)}`}
                  className={i === active % banners.length ? 'on' : ''}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
          )}
        </BannerFrame>
      </Container>
    </HeroBannerSection>
  );
}

/** HOME_STRIP — ingichka aksiya chizig'i (bosh sahifa o'rtasi). */
export function PromoStrip() {
  const { data } = useQuery({
    queryKey: ['banners', 'HOME_STRIP'],
    queryFn: () => api.get('/banners?position=HOME_STRIP'),
  });
  const banner = Array.isArray(data) ? data[0] : undefined;
  if (!banner) {
    return null;
  }
  return (
    <StripSection>
      <Container>
        <BannerLinkWrap linkUrl={banner.linkUrl}>
          <StripCard>
            <img src={banner.imageUrl} alt={label(banner.title)} loading="lazy" />
            <div className="shade" />
            <div className="content">{label(banner.title)}</div>
          </StripCard>
        </BannerLinkWrap>
      </Container>
    </StripSection>
  );
}
