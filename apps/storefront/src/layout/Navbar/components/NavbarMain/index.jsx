import React from "react";
import {
  CartIcon,
  CatalogIcon,
  HeartIcon,
  NetworkIcon,
  SearchIcon,
} from "../../../../components";

import {
  NavMainWrapper,
  SearchWrapper,
  NavigationItems,
} from "./NavbarMain.styled";
import { Link } from "react-router-dom";

function NavbarMain() {
  return (
    <NavMainWrapper>
      <img src="/logo.svg" alt="Logo" />
      <SearchWrapper>
        <Link to="/catalog" className="link">
          <button className="catalog-button">
            <CatalogIcon />
            <span>Каталог</span>
          </button>
        </Link>

        <div className="input-wrapper">
          <input type="text" placeholder="Поиск по товарам" />
          <span className="search-icon-wrap">
            <SearchIcon />
          </span>
        </div>
      </SearchWrapper>
      <NavigationItems>
        <Link to="/favorites" className="item">
          <div className="item">
            <HeartIcon />
            <span>Избранное</span>
          </div>
        </Link>

        <div className="item">
          <NetworkIcon />
          <span>Сравнение</span>
        </div>
        <Link to="/basket" className="item">
          <CartIcon className="cart-icon" />
          <p>1</p>
          <span>Корзина</span>
        </Link>
      </NavigationItems>
    </NavMainWrapper>
  );
}

export default NavbarMain;
