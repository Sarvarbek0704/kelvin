import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../../components/ui';

const Wrap = styled.div`
  background: ${(p) => p.theme.color.footerInk};
  position: relative;
  text-align: center;
  padding: 90px 24px;

  .edge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(p) => p.theme.gradient};
  }

  .code {
    font-family: ${(p) => p.theme.font.serif};
    font-weight: 500;
    font-size: 140px;
    line-height: 1;
    color: ${(p) => p.theme.color.base};
    letter-spacing: 0.02em;
  }

  .bar {
    width: 200px;
    height: 6px;
    border-radius: 999px;
    margin: 18px auto 28px;
    background: ${(p) => p.theme.gradient};
  }

  .quote {
    font-family: ${(p) => p.theme.font.serif};
    font-style: italic;
    font-size: 28px;
    color: ${(p) => p.theme.color.footerText};
    margin-bottom: 12px;
  }

  .text {
    font-size: 15px;
    color: ${(p) => p.theme.color.inkMuted};
    max-width: 380px;
    margin: 0 auto 30px;
    line-height: 1.6;
  }

  .actions {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .ghost {
    border-color: rgba(201, 191, 169, 0.4);
    color: ${(p) => p.theme.color.base};

    &:hover:not(:disabled) {
      background: rgba(201, 191, 169, 0.1);
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 64px 18px;

    .code {
      font-size: 96px;
    }

    .quote {
      font-size: 22px;
    }
  }
`;

/** 404 — futer-ink fonda "Здесь погас свет". */
function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Wrap>
      <div className="edge" />
      <div className="code">404</div>
      <div className="bar" />
      <div className="quote">Здесь погас свет</div>
      <div className="text">Такой страницы нет или её перенесли. Вернёмся туда, где светло.</div>
      <div className="actions">
        <Button type="button" $variant="brass" onClick={() => navigate('/')}>
          На главную
        </Button>
        <Button type="button" $variant="outline" className="ghost" onClick={() => navigate('/catalog')}>
          В каталог
        </Button>
      </div>
    </Wrap>
  );
}

export default NotFoundPage;
