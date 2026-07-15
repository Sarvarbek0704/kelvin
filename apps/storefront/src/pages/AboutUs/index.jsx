import React from "react";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import Brands from "../../components/brands/Brands";
import Blog from "../../components/blog";

import {
  AboutUsWrapper,
  BreadcrumbLink,
  BreadcrumbSpan,
  AboutUsMain,
  MainLeft,
  MainRight,
  AboutUsTitle,
  LeftCardsContainer,
  LeftCard,
  RightCardsContainer,
  RightCard,
} from "./AboutUs.styled";

function AboutUs() {
  return (
    <div>
      <Navbar />
      <AboutUsWrapper>
        <BreadcrumbLink href="/">Главная {" >"}</BreadcrumbLink>
        <BreadcrumbSpan> О компании</BreadcrumbSpan>
        <AboutUsMain>
          <MainLeft>
            <AboutUsTitle>О компании</AboutUsTitle>
            <LeftCardsContainer>
              <LeftCard>
                <h1>170+</h1>
                <p>Товаров</p>
              </LeftCard>
              <LeftCard>
                <h1>1000+</h1>
                <p>Довольных покупателей</p>
              </LeftCard>
              <LeftCard>
                <h1>170+</h1>
                <p>Товаров</p>
              </LeftCard>
            </LeftCardsContainer>
          </MainLeft>
          <MainRight>
            <RightCardsContainer>
              <RightCard>
                <p>
                  Интернет-магазин Kelvin предлагает широкий ассортимент
                  светильников для освещения вашего дома или офиса. У нас вы
                  найдете разнообразные модели светильников, от современных и
                  стильных до классических и элегантных. Мы предлагаем
                  качественные и надежные светильники от лучших производителей,
                  которые подарят вам комфорт и уют.
                </p>
              </RightCard>
              <RightCard>
                <p>
                  Покупая светильники в нашем интернет-магазине, вы получаете
                  отличное соотношение цены и качества. Мы осуществляем доставку
                  по всей России, чтобы каждый клиент мог насладиться прекрасным
                  светом и удобством покупки онлайн. Обратитесь к нам сегодня и
                  превратите ваш дом в оазис тепла и света с Kelvin!
                </p>
              </RightCard>
              <RightCard>
                <p>
                  Интернет-магазин Kelvin предлагает широкий ассортимент
                  светильников для освещения вашего дома или офиса. У нас вы
                  найдете разнообразные модели светильников, от современных и
                  стильных до классических и элегантных. Мы предлагаем
                  качественные и надежные светильники от лучших производителей,
                  которые подарят вам комфорт и уют.
                </p>
              </RightCard>
              <RightCard>
                <p>
                  Покупая светильники в нашем интернет-магазине, вы получаете
                  отличное соотношение цены и качества. Мы осуществляем доставку
                  по всей России, чтобы каждый клиент мог насладиться прекрасным
                  светом и удобством покупки онлайн. Обратитесь к нам сегодня и
                  превратите ваш дом в оазис тепла и света с Kelvin!
                </p>
              </RightCard>
            </RightCardsContainer>
          </MainRight>
        </AboutUsMain>
      </AboutUsWrapper>
      <Brands />
      <Blog />
      <Footer />
    </div>
  );
}

export default AboutUs;
