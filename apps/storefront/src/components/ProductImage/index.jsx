import React, { useState } from 'react';
import styled from 'styled-components';
import { srcSetFrom } from '../../lib/image';

/**
 * Responsive rasm — asosiy media (search `primary_image` yoki media qatori).
 *
 * ⚠️ Har ikkala shakl ham `url` + `derivatives` ({ "webp_400": "...", ... })
 *    beradi — komponent shu ikkitasiga tayanadi, alt esa aniq prop bilan keladi.
 *
 * - srcset: `derivatives` kalitidagi kenglikdan (`webp_400` → `... 400w`) yasaladi.
 * - LQIP: gradient placeholder + yuklanganda silliq fade-in (qo'shimcha so'rovsiz).
 * - lazy + async dekodlash — pastdagi kartalar viewportga kirganda yuklanadi.
 * - rasm yo'q bo'lsa placeholder matni (kartochka bo'sh qolmaydi).
 */
const Frame = styled.div`
  position: relative;
  overflow: hidden;
  /* Warm-boutique chiziqli placeholder — foto tushguncha brendlangan holat */
  background: repeating-linear-gradient(
    135deg,
    #f1ebe0,
    #f1ebe0 11px,
    #ece4d6 11px,
    #ece4d6 22px
  );

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: ${(p) => (p.$loaded ? 1 : 0)};
    transition: opacity 0.35s ease;
  }

  .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, monospace;
    color: #a79e90;
    font-size: 11px;
  }
`;

function ProductImage({ image, alt = '', sizes = '100vw', className, placeholder = 'фото товара' }) {
  const [loaded, setLoaded] = useState(false);

  if (!image?.url) {
    return (
      <Frame className={className} $loaded={false}>
        <span className="placeholder">{placeholder}</span>
      </Frame>
    );
  }

  return (
    <Frame className={className} $loaded={loaded}>
      <img
        src={image.url}
        srcSet={srcSetFrom(image.derivatives)}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </Frame>
  );
}

export default ProductImage;
