import React from 'react';
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
  {
    icon: <IconTruck size={26} />,
    title: 'Доставка по зонам',
    text: 'По Ташкенту и области, с расчётом по зоне и бережной упаковкой хрупких люстр.',
  },
  {
    icon: <InstallIcon />,
    title: 'Установка',
    text: 'Монтаж тяжёлых и потолочных фикстур нашими электриками — свет под ключ.',
  },
  {
    icon: <IconShield size={26} />,
    title: 'Гарантия',
    text: 'Официальная гарантия брендов и сервис. Диммеры и драйверы подберём совместимые.',
  },
];

/** "Почему Kelvin" — salon uch ustuni (dostavka / o'rnatish / kafolat). */
function Reasons() {
  return (
    <ReasonsSection>
      <Container>
        <div className="head">
          <Kicker as="div">Почему Kelvin</Kicker>
          <h2>Салон, а не маркетплейс</h2>
        </div>
        <CardsRow>
          {REASONS.map((reason) => (
            <ReasonCard key={reason.title}>
              <div className="icon">{reason.icon}</div>
              <div>
                <div className="title">{reason.title}</div>
                <div className="text">{reason.text}</div>
              </div>
            </ReasonCard>
          ))}
        </CardsRow>
      </Container>
    </ReasonsSection>
  );
}

export default Reasons;
