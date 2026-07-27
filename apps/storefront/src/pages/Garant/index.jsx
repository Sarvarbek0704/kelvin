import React from 'react';
import styled from 'styled-components';
import CmsBlock from '../../components/CmsBlock';
import { Container, Kicker, IconShield } from '../../components/ui';

const Wrap = styled.div`
  padding: 48px 0 64px;
  max-width: 720px;

  .icon {
    width: 52px;
    height: 52px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.deep};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.color.brassDark};
    margin: 20px 0;
  }

  h1 {
    font-size: 40px;
    margin: 0 0 16px;
  }

  p {
    font-size: 15px;
    line-height: 1.75;
    color: ${(p) => p.theme.color.bodyTextAlt};
    margin: 0 0 16px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyTextAlt};
  }

  .item {
    display: flex;
    gap: 10px;

    .b {
      color: ${(p) => p.theme.color.brassDark};
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 24px 0 40px;

    h1 {
      font-size: 32px;
    }
  }
`;

function Garant() {
  return (
    <div>
      <Container>
        <Wrap>
          <Kicker as="div">Информация</Kicker>
          <div className="icon">
            <IconShield size={26} />
          </div>
          <h1>Гарантия</h1>
          <p>
            Официальная гарантия производителя <b>от 12 до 36 месяцев</b> в зависимости от
            бренда. Распространяется на драйверы, LED-модули и механику фикстур.
          </p>
          <div className="list">
            <div className="item">
              <span className="b">•</span>Сохраняйте чек и упаковку.
            </div>
            <div className="item">
              <span className="b">•</span>Монтаж нашим электриком продлевает сервис.
            </div>
            <div className="item">
              <span className="b">•</span>Диммеры подбираем совместимые бесплатно.
            </div>
          </div>
        </Wrap>
      </Container>

      {/* CMS kontenti (admin boshqaradi) */}
      <CmsBlock slug="garantiya" />
    </div>
  );
}

export default Garant;
