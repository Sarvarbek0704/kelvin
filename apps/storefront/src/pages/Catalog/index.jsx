import React from "react";
import { CatalogWrapper } from "./Catalog.styled";
import { Link } from "react-router-dom";

import cat1 from "../../assets/katalog1.png";
import cat2 from "../../assets/katalog2.png";
import cat3 from "../../assets/katalog3.png";
import cat4 from "../../assets/katalog4.png";
import cat5 from "../../assets/katalog5.png";
import cat6 from "../../assets/katalog6.png";
import cat7 from "../../assets/katalog7.png";
import cat8 from "../../assets/katalog8.png";
import cat9 from "../../assets/katalog9.png";
import cat10 from "../../assets/katalog10.png";
import cat11 from "../../assets/katalog11.png";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import { BreadcrumbLink } from "../ProductDetail/ProductDetail.styled";
import { BreadcrumbSpan } from "../AboutUs/AboutUs.styled";
import Brands from "../../components/brands/Brands";
import Blog from "../../components/blog";

function Catalog() {
  return (
    <div>
      <Navbar />
      <CatalogWrapper>
        <BreadcrumbLink href="/">Главная {" >"}</BreadcrumbLink>
        <BreadcrumbSpan> Каталог</BreadcrumbSpan>

        <div className="catalogGrid">
          {[
            { img: cat1, text: "Люстры" },
            { img: cat2, text: "Светильники" },
            { img: cat3, text: "Бра" },
            { img: cat4, text: "Торшеры" },
            { img: cat5, text: "Настольные лампы" },
            { img: cat6, text: "Споты" },
            { img: cat7, text: "Трековые светильники" },
            { img: cat8, text: "Уличные светильники" },
            { img: cat9, text: "Технические светильники" },
          ].map((prd, i) => (
            <div key={i} className="catalogCard">
              <div>
                <p className="catalogText">{prd.text}</p>
                <p>От 540  so'm →</p>
              </div>
              <img src={prd.img} alt="" />
            </div>
          ))}
        </div>
        <div className="catalogGrid2">
          {[
            { img: cat10, text: "Светодиодные ленты" },
            { img: cat11, text: "Комплектующие" },
          ].map((prd, i) => (
            <div key={i} className="catalogCard">
              <div>
                <p className="catalogText">{prd.text}</p>
                <p>От 540  so'm →</p>
              </div>
              <img src={prd.img} alt="" />
            </div>
          ))}
        </div>
      </CatalogWrapper>
      <Brands />
      <Blog />
      <Footer />
    </div>
  );
}

export default Catalog;
