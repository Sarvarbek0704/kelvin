import React from 'react';
import styled from 'styled-components';
import CmsBlock from '../../components/CmsBlock';
import { Container, Kicker } from '../../components/ui';

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

  .steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyTextAlt};
  }

  .step {
    display: flex;
    gap: 10px;

    .n {
      color: ${(p) => p.theme.color.brassDark};
      font-weight: 600;
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 24px 0 40px;

    h1 {
      font-size: 32px;
    }
  }
`;

function Return() {
  return (
    <div>
      <Container>
        <Wrap>
          <Kicker as="div">Информация</Kicker>
          <div className="icon">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 9h10a5 5 0 0 1 0 10H8" />
              <path d="m8 5-4 4 4 4" />
            </svg>
          </div>
          <h1>Возврат</h1>
          <p>
            Товар можно вернуть в течение <b>14 дней</b>, если он не был в эксплуатации,
            сохранены упаковка и комплектующие. Свет — хрупкий товар, поэтому проверяйте
            фикстуру при курьере.
          </p>
          <div className="steps">
            <div className="step">
              <span className="n">1.</span>Свяжитесь с нами и опишите причину.
            </div>
            <div className="step">
              <span className="n">2.</span>Согласуем самовывоз или доставку.
            </div>
            <div className="step">
              <span className="n">3.</span>Возврат средств тем же способом, 3–5 дней.
            </div>
          </div>
        </Wrap>
      </Container>

      {/* CMS kontenti (admin boshqaradi) */}
      <CmsBlock slug="vozvrat" />
    </div>
  );
}

export default Return;
