import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Kicker, IconTruck, IconShield } from '../ui';
import { ReasonsSection, CardsRow, ReasonCard } from './Reason.styled';

// O'rnatish ikonkasi (kalит) — dizayn mockupidan, boshqa joyda ishlatilmaydi.
const InstallIcon = () => (
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
    <path d="M14 3l-1 4 4 4-3 3-4-4-4 1 1-4" />
    <path d="m10 14-6 6" />
  </svg>
);

const REASONS = [
  { icon: <IconTruck size={26} />, key: 'delivery' },
  { icon: <InstallIcon />, key: 'install' },
  { icon: <IconShield size={26} />, key: 'warranty' },
];

/** "Почему Kelvin" — salon uch ustuni (dostavka / o'rnatish / kafolat). */
function Reasons() {
  const { t } = useTranslation();
  return (
    <ReasonsSection>
      <Container>
        <div className="head">
          <Kicker as="div">{t('home.why_kicker')}</Kicker>
          <h2>{t('home.why_title')}</h2>
        </div>
        <CardsRow>
          {REASONS.map((reason) => (
            <ReasonCard key={reason.key}>
              <div className="icon">{reason.icon}</div>
              <div>
                <div className="title">{t(`home.why_${reason.key}_title`)}</div>
                <div className="text">{t(`home.why_${reason.key}_text`)}</div>
              </div>
            </ReasonCard>
          ))}
        </CardsRow>
      </Container>
    </ReasonsSection>
  );
}

export default Reasons;
