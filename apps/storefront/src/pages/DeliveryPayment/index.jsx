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
  SubSection,
  BlueText,
  FullWidthMap,
} from "./DeliveryPayment.styled";

function DeliveryPayment() {
  return (
    <div>
      <Navbar />
      <DeliveryWrapper>
        <BreadcrumbLink href="/">Главная {">"}</BreadcrumbLink>
        <BreadcrumbSpan> Доставка и оплата</BreadcrumbSpan>

        <ContentContainer>
          <LeftColumn>
            <h1>Доставка и оплата</h1>
          </LeftColumn>

          <RightColumn>
            <DeliverySection>
              <h2>Доставка</h2>
              <p>
                Мы осуществляем доставку со склада по Москве и Московской
                области собственной курьерской службой. Транспортными компаниями
                нашу продукцию мы доставляем по всей территории РФ, а также по
                всем странам СНГ.{" "}
                <BlueText>Сроки доставки: 4—6 недель</BlueText>
              </p>

              <SubSection>
                <h3>Курьерская доставка</h3>
                <p>
                  БЕСПЛАТНО доставим в приделах МКАД любой заказ{" "}
                  <BlueText>от 5 000  so'm.</BlueText> Заказы свыше{" "}
                  <BlueText>30 000  so'm</BlueText> имеют бесплатную доставку,
                  включительно 15 км от МКАД.
                </p>
              </SubSection>

              <SubSection>
                <h3>Самовывоз</h3>
                <p>
                  Любой заказ можно забрать самостоятельно по адресу: г. Москва,
                  Дмитровское шоссе д.100с2
                </p>
              </SubSection>
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
        ></iframe>
      </FullWidthMap>

      <Footer />
    </div>
  );
}

export default DeliveryPayment;
