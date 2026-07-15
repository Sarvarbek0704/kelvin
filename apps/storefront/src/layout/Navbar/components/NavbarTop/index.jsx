import React from "react";
import {
  NavTopWrapper,
  CustomNavLink,
  NavTopSide,
  OrderPhoneButton,
  PhoneLink,
} from "./NavbarTop.styled";

function NavbarTop() {
  return (
    <NavTopWrapper>
      <NavTopSide>
        <CustomNavLink to="/about-us">О компании</CustomNavLink>
        <CustomNavLink to="/delivery-payment">Доставка и оплата</CustomNavLink>
        <CustomNavLink to="/return">Возврат</CustomNavLink>
        <CustomNavLink to="/garant">Гарантии</CustomNavLink>
        <CustomNavLink to="/contacts">Контакты</CustomNavLink>
        <CustomNavLink to="/blog">Блог</CustomNavLink>
      </NavTopSide>
      <NavTopSide>
        <PhoneLink href="tel:+998712004000">+998 (71) 200-40-00</PhoneLink>
        <OrderPhoneButton>Заказать звонок</OrderPhoneButton>
      </NavTopSide>
    </NavTopWrapper>
  );
}

export default NavbarTop;
