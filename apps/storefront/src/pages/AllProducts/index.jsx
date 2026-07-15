import React from "react";
import lyustra from "../../assets/lyustra.png";
import { CartIcon, HeartIcon } from "../../components/icons";
import {
  ManageProductContainer,
  ProductHeader,
  ProductSubtitle,
  AllProductsLink,
  AllProductsButton,
  ProductCardsContainer,
  ProductCard,
  ProductImage,
  ProductTitle,
  ProductCardFooter,
  PriceContainer,
  OldPrice,
  NewPrice,
  CartButton,
} from "./Products.styled";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import { Link } from "react-router-dom";

function Products() {
  const products = Array(8).fill({
    title: "Встраиваемый светильник Novotech",
    oldPrice: "7 000 so'm",
    newPrice: "6 399 so'm",
    image: lyustra,
  });

  return (
    <div>
      <Navbar />
      <ManageProductContainer>
        <ProductHeader>
          <a href="/">Главная {">"}</a>
          <ProductSubtitle>Популярные товары</ProductSubtitle>
        </ProductHeader>
        <ProductCardsContainer>
          {products.map((product, index) => (
            <Link to="/product-detail" className="link">
              <ProductCard key={index}>
                <div className="heart-icon">
                  <HeartIcon />
                </div>
                <ProductImage src={product.image} alt={product.title} />
                <ProductTitle>{product.title}</ProductTitle>
                <ProductCardFooter>
                  <PriceContainer>
                    <OldPrice>{product.oldPrice}</OldPrice>
                    <NewPrice>{product.newPrice}</NewPrice>
                  </PriceContainer>
                  <CartButton>
                    <CartIcon color="white" width="12" height="16" />
                  </CartButton>
                </ProductCardFooter>
              </ProductCard>
            </Link>
          ))}
        </ProductCardsContainer>
      </ManageProductContainer>
      <Footer />
    </div>
  );
}

export default Products;
