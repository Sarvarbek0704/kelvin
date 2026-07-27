import React from 'react';
import styled from 'styled-components';
import CmsBlock from '../../components/CmsBlock';
import Brands from '../../components/brands/Brands';
import { Container, Kicker } from '../../components/ui';

const Split = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  border-bottom: 1px solid ${(p) => p.theme.color.border};

  .text {
    padding: 72px 56px 72px 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  h1 {
    font-size: 56px;
    line-height: 1.05;
    margin: 18px 0 22px;
  }

  p {
    font-size: 17px;
    line-height: 1.8;
    color: ${(p) => p.theme.color.bodyTextAlt};
    margin: 0 0 18px;
  }

  .visual {
    position: relative;
    background: repeating-linear-gradient(
      135deg,
      #efe8dc,
      #efe8dc 16px,
      #e9e0d2 16px,
      #e9e0d2 32px
    );
    min-height: 480px;

    .glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(45% 40% at 55% 40%, rgba(255, 180, 107, 0.3), transparent 72%);
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;

    .text {
      padding: 36px 0;
    }

    h1 {
      font-size: 36px;
    }

    .visual {
      min-height: 220px;
    }
  }
`;

const StatsBand = styled.div`
  background: ${(p) => p.theme.color.deep};
  padding: 56px 0;

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
    text-align: center;
  }

  .num {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 52px;
    color: ${(p) => p.theme.color.brassDark};
  }

  .cap {
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyText};
    margin-top: 6px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 32px 0;

    .grid {
      gap: 20px;
    }

    .num {
      font-size: 34px;
    }
  }
`;

function AboutUs() {
  return (
    <div>
      <Container>
        <Split>
          <div className="text">
            <Kicker as="div">О компании</Kicker>
            <h1>
              Салон света,
              <br />а не склад
            </h1>
            <p>
              Kelvin — кураторский магазин освещения в Ташкенте. Мы собираем фикстуры так, как
              это делают в дизайнерских шоурумах: по температуре света, качеству сборки и
              характеру металла.
            </p>
            <p>
              К нам приходят и хозяева квартир, и дизайнеры интерьера — за консультацией,
              установкой и светом, которому доверяют.
            </p>
          </div>
          <div className="visual">
            <div className="glow" />
          </div>
        </Split>
      </Container>

      <StatsBand>
        <Container>
          <div className="grid">
            <div>
              <div className="num">8 лет</div>
              <div className="cap">на рынке света Ташкента</div>
            </div>
            <div>
              <div className="num">2 400+</div>
              <div className="cap">позиций в каталоге</div>
            </div>
            <div>
              <div className="num">12</div>
              <div className="cap">проверенных брендов</div>
            </div>
          </div>
        </Container>
      </StatsBand>

      {/* CMS kontenti (admin boshqaradi) — bo'lsa statik matn ostida chiqadi */}
      <CmsBlock slug="o-kompanii" />
      <Brands />
    </div>
  );
}

export default AboutUs;
