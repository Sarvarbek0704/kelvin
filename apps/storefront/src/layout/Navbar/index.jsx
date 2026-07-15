import React, { useRef } from "react";
import NavbarTop from "./components/NavbarTop";
import NavbarMain from "./components/NavbarMain";

import { NavbarWrapper } from "./Navbar.styled";
import HamburgerIcon from "../../components/icons/src/Hamburger.icon";
import {
  CartIcon,
  CatalogIcon,
  CloseIcon,
  HeartIcon,
  SearchIcon,
} from "../../components";

function Navbar() {
  const mobNavRef = useRef(null);

  const handleOpen = () => {
    mobNavRef.current.classList.toggle("visible");
  };

  return (
    <NavbarWrapper>
      <div className="container desktop-content">
        <NavbarTop />
        <NavbarMain />
      </div>

      <div className="container mobile-content">
        <div className="mobile-header">
          <button onClick={handleOpen} className="hamburger-btn">
            <HamburgerIcon />
          </button>

          <img src="/logo.svg" alt="Logo" className="mobile-logo" />

          <div className="mobile-icons">
            <button className="mobile-icon-btn">
              <HeartIcon />
            </button>
            <button className="mobile-icon-btn">
              <CartIcon />
            </button>
          </div>
        </div>

        <div ref={mobNavRef} className="mobile-opening-content">
          <div className="mobile-nav-header">
            <button onClick={handleOpen} className="close-btn">
              <CloseIcon />
            </button>
          </div>

          <div className="mobile-links">
            <a href="/about-us">О компании</a>
            <a href="/delivery-payment">Доставка и оплата</a>
            <a href="/return">Возврат</a>
            <a href="/garant">Гарантии</a>
            <a href="/contacts">Контакты</a>
            <a href="/blog">Блог</a>
            <button className="mobile-catalog-btn">
              <CatalogIcon />
              <span>Каталог</span>
            </button>
            <a href="tel:+998712004000" className="mobile-phone">
              <span>+998 (71) 200-40-00</span>
            </a>
            <button className="call-back-btn">Заказать звонок</button>
          </div>
        </div>
      </div>
    </NavbarWrapper>
  );
}

export default Navbar;
