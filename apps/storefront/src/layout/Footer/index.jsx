import React from "react";
import PaymentLogos from "../../assets/payments.png";
import { VkIcon } from "../../components";
import {
  FooterWrapper,
  FooterSectionOne,
  LogoFooter,
  FooterPhone,
  PaymentLogos as PaymentLogosImg,
  FooterLink,
  VkIconsContainer,
  FooterSectionTwo,
  FooterSectionThree,
  FooterTitle,
  SectionTwoLink,
  ProductsGrid,
  ProductLink,
} from "./Footer.styled";

function Footer() {
  return (
    <FooterWrapper>
      <FooterSectionOne>
        <LogoFooter src="/logo-foot.svg" alt="Logo Footer" />
        <FooterPhone href="tel:+998712004000">+998 (71) 200-40-00</FooterPhone>

        <PaymentLogosImg src={PaymentLogos} alt="Payments" />

        <FooterLink href="#">Политика конфиденциальности</FooterLink>
        <FooterLink href="#">Пользовательское соглашение</FooterLink>
        <VkIconsContainer>
          <VkIcon />
          <VkIcon />
          <VkIcon />
        </VkIconsContainer>
      </FooterSectionOne>
      <FooterSectionTwo>
        <FooterTitle>Покупателям</FooterTitle>
        <SectionTwoLink href="/about-us">О компании</SectionTwoLink>
        <SectionTwoLink href="/delivery-payment">
          Доставка и оплата
        </SectionTwoLink>
        <SectionTwoLink href="/return">Возврат</SectionTwoLink>
        <SectionTwoLink href="/garant">Гарантии</SectionTwoLink>
        <SectionTwoLink href="/contacts">Контакты</SectionTwoLink>
        <SectionTwoLink href="/blog">Блог</SectionTwoLink>
      </FooterSectionTwo>
      <FooterSectionThree>
        <FooterTitle>Товары</FooterTitle>
        <ProductsGrid>
          <ProductLink href="#">Люстры</ProductLink>
          <ProductLink href="#">Споты</ProductLink>
          <ProductLink href="#">Светильники</ProductLink>
          <ProductLink href="#">Трековые светильники</ProductLink>
          <ProductLink href="#">Бра</ProductLink>
          <ProductLink href="#">Уличные светильники</ProductLink>
          <ProductLink href="#">Торшеры</ProductLink>
          <ProductLink href="#">Технические светильники</ProductLink>
          <ProductLink href="#">Комплектуюшие</ProductLink>
          <ProductLink href="#">Светодиодные ленты</ProductLink>
          <ProductLink href="#">Настольные лампы</ProductLink>
        </ProductsGrid>
      </FooterSectionThree>
    </FooterWrapper>
  );
}

export default Footer;
