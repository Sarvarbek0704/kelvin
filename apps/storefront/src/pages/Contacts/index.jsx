import React from "react";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

import {
  DeliveryWrapper,
  BreadcrumbLink,
  BreadcrumbSpan,
  ContentContainer,
  LeftColumn,
  RightColumn,
  DeliverySection,
  FullWidthMap,
} from "./Contacts.styled";

function Contacts() {
  return (
    <div>
      <Navbar />
      <DeliveryWrapper>
        <BreadcrumbLink href="/">Главная {">"}</BreadcrumbLink>
        <BreadcrumbSpan> Контакты</BreadcrumbSpan>

        <ContentContainer>
          <LeftColumn>
            <h1>Контакты</h1>
          </LeftColumn>

          <RightColumn>
            <DeliverySection>
              <h2>+998 (71) 200-40-00</h2>
              <p>Пн-Пт: 10:00 до 19:00 Сб-Вс: заказ через корзину Телефоны: </p>
            </DeliverySection>
          </RightColumn>
        </ContentContainer>
      </DeliveryWrapper>

      <FullWidthMap>
        <iframe
          src="https://www.google.com/maps?q=41.2995,69.2401&hl=uz&z=15&output=embed"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Карта доставки"
        />

        <div className="map-overlay">
          <div>
            <span>Адрес магазина</span>
            <p>г. Ташкент, Мирабадский район, ул. Афросиаб, 12</p>
          </div>

          <div>
            <span>Почта</span>
            <p>info@kelvin.uz</p>
          </div>

          <div>
            <span>Телефон</span>
            <p>+998 (71) 200-40-00</p>
          </div>

          <button>Оставить заявку</button>
        </div>
      </FullWidthMap>

      <Footer />
    </div>
  );
}

export default Contacts;
