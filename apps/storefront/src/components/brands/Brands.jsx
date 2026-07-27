import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from '../ui';
import { BrandsStrip } from './Brands.styled';

// Dizayn nusxasi — serif so'z-belgilar (logotip rasm o'rniga, warm-boutique).
const BRANDS = ['Novotech', 'Maytoni', 'Lightstar', 'Denkirs', 'Arte Lamp', 'Odeon'];

function Brands() {
  const { t } = useTranslation();
  return (
    <BrandsStrip>
      <Container>
        <div className="kicker">{t('home.brands_kicker')}</div>
        <div className="row">
          {BRANDS.map((name) => (
            <div className="brand" key={name}>
              {name}
            </div>
          ))}
        </div>
      </Container>
    </BrandsStrip>
  );
}

export default Brands;
