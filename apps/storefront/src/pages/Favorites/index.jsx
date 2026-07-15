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
} from "./Favorites.styled";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import { Link } from "react-router-dom";

function Favorites() {
  const products = Array(4).fill({
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
          <div className="uvo">
            <h1>Избранные товары</h1>
            <div className="uvo-2">
              <span>2</span>
            </div>
          </div>
        </ProductHeader>
        <ProductCardsContainer>
          {products.map((product, index) => (
            <Link to="/product-detail" className="link">
              <ProductCard key={index}>
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

export default Favorites;
