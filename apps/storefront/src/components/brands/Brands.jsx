import React from 'react';
import { Container } from '../ui';
import { BrandsStrip } from './Brands.styled';

// Dizayn nusxasi — serif so'z-belgilar (logotip rasm o'rniga, warm-boutique).
const BRANDS = ['Novotech', 'Maytoni', 'Lightstar', 'Denkirs', 'Arte Lamp', 'Odeon'];

function Brands() {
  return (
    <BrandsStrip>
      <Container>
        <div className="kicker">Только проверенные бренды</div>
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
