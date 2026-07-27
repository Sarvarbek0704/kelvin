import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Switcher = styled.div`
  display: inline-flex;
  gap: 2px;
  border: 1px solid rgba(138, 106, 59, 0.35);
  border-radius: 999px;
  overflow: hidden;

  button {
    border: 0;
    background: transparent;
    padding: 4px 10px;
    font-family: ${(p) => p.theme.font.sans};
    font-size: 12px;
    font-weight: 600;
    color: ${(p) => p.theme.color.inkMuted};
    cursor: pointer;
    line-height: 1.4;

    &.active {
      background: ${(p) => p.theme.color.brass};
      color: ${(p) => p.theme.color.surface};
    }
  }
`;

const LANGS = ['ru', 'uz'];

function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('uz') ? 'uz' : 'ru';

  return (
    <Switcher className={className}>
      {LANGS.map((lng) => (
        <button
          key={lng}
          className={current === lng ? 'active' : ''}
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </Switcher>
  );
}

export default LanguageSwitcher;
