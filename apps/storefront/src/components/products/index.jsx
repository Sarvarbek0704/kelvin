import React from "react";
import lyustra from "../../assets/lyustra.png";
import { CartIcon, HeartIcon } from "../icons";
import catalogIcon from "../../assets/catalog-icon.png";
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
import { Link } from "react-router-dom";

function Products() {
  const products = Array(8).fill({
    title: "Встраиваемый светильник Novotech",
    oldPrice: "7 000 so'm",
    newPrice: "6 399 so'm",
    image: lyustra,
  });

  return (
    <ManageProductContainer>
      <ProductHeader>
        <ProductSubtitle>Популярные товары</ProductSubtitle>
        <AllProductsLink to="/all-products">
          <AllProductsButton>
            Все товары <img src={catalogIcon} alt="catalogIcon" />
          </AllProductsButton>
        </AllProductsLink>
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
  );
}

export default Products;
