import React from "react";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

import {
  ReturnWrapper,
  BreadcrumbLink,
  BreadcrumbSpan,
  ContentContainer,
  LeftColumn,
  RightColumn,
  ReturnSection,
  ReturnSubSection,
  BlueText,
  BulletList,
  BulletListItem,
} from "./Garant.styled.js";

function Garant() {
  return (
    <div>
      <Navbar />
      <ReturnWrapper>
        <BreadcrumbLink href="/">Главная {">"}</BreadcrumbLink>
        <BreadcrumbSpan> Гарантии</BreadcrumbSpan>

        <ContentContainer>
          <LeftColumn>
            <h1>Гарантии</h1>
          </LeftColumn>

          <RightColumn>
            <ReturnSection>
              <h2>Обмен и возврат по желанию покупателя</h2>
              <p>
                Все товары в магазине «Kelvin» имеют гарантию. Она заявляется
                производителем и имеет определенный срок действия на различные
                группы товаров. Если ваше изделие вышло из строя в течение
                гарантийного срока вы можете обратиться к нам и получить
                бесплатный ремонт. Для этого нужно:
              </p>

              <BulletList>
                <BulletListItem>
                  Предоставить чек, накладную или сообщить почту или номер
                  телефона, указанные при оформлении заказа.
                </BulletListItem>
                <BulletListItem>
                  Привезти товар к нам на склад или отправить его транспортной
                  компанией.
                </BulletListItem>
                <BulletListItem>
                  После товар отправляется на экспертизу и ремонт. Если ремонт
                  невозможен, мы обменяем изделие на аналогичное либо вернем
                  деньги за покупку
                </BulletListItem>
              </BulletList>
            </ReturnSection>
          </RightColumn>
        </ContentContainer>
      </ReturnWrapper>
      <Footer />
    </div>
  );
}

export default Garant;
