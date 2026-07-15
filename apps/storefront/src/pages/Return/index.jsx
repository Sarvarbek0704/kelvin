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
} from "./Return.styled.js";

function Return() {
  return (
    <div>
      <Navbar />
      <ReturnWrapper>
        <BreadcrumbLink href="/">Главная {">"}</BreadcrumbLink>
        <BreadcrumbSpan> Возврат</BreadcrumbSpan>

        <ContentContainer>
          <LeftColumn>
            <h1>Возврат</h1>
          </LeftColumn>

          <RightColumn>
            <ReturnSection>
              <h2>Обмен и возврат по желанию покупателя</h2>
              <p>
                Если товар по каким-то причинам не подошел вам, вы имеете право
                вернуть его или обменять на другой в течение 7 дней* с момента
                покупки при соблюдении следующих условий:
              </p>

              <BulletList>
                <BulletListItem>
                  Товар имеет первоначальный вид, имеется товарная кондиция;
                </BulletListItem>
                <BulletListItem>
                  Товар имеет полную комплектацию, включая упаковочные
                  материалы;
                </BulletListItem>
                <BulletListItem>
                  Товар не имеет следов подключения и не имеет признаков
                  монтажа;
                </BulletListItem>
                <BulletListItem>
                  Упаковка товара не имеет повреждений, присутствует
                  первоначальный товарный вид;
                </BulletListItem>
                <BulletListItem>
                  Есть документ, подтверждающий покупку в нашем
                  интернет-магазине.
                </BulletListItem>
                <BulletListItem>
                  Для возврата товара необходимо привезти его к нам в офис.
                </BulletListItem>
                <BulletListItem>
                  Товар из других городов можно прислать нам транспортной
                  компанией, при этом услуги транспортной компании оплачиваются
                  клиентом.
                </BulletListItem>
                <BulletListItem>
                  В течение 14 дней для отдельных брендов. При оформлении заказа
                  уточните у менеджера.
                </BulletListItem>
              </BulletList>
            </ReturnSection>

            <ReturnSubSection>
              <h3>Обмен и возврат по ошибке продавца</h3>
              <p>Причины обмена или возврата по ошибке продавца:</p>

              <BulletList>
                <BulletListItem>Неполная комплектация товара</BulletListItem>
                <BulletListItem>Брак или дефект товара</BulletListItem>
                <BulletListItem>
                  Если вы выявили дефект, брак или неполную комплектацию товара,
                  необходимо сделать фото дефекта и отправить на почту{" "}
                  <BlueText>mail@at-svet.ru</BlueText>, указав краткое описание
                  характера брака/
                </BulletListItem>
                <BulletListItem>
                  Мы заменим бракованный товар или довезем недостающие части.
                  Доставка будет осуществлена бесплатно.
                </BulletListItem>
              </BulletList>
            </ReturnSubSection>

            <ReturnSubSection>
              <h3>Возврат денежных средств</h3>
              <p>
                Возврат денежных средств осуществляется путем перевода на
                банковские реквизиты покупателя при наличии заявления от
                покупателя.
              </p>
            </ReturnSubSection>
          </RightColumn>
        </ContentContainer>
      </ReturnWrapper>
      <Footer />
    </div>
  );
}

export default Return;
