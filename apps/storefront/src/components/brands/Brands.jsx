import React from "react";
import brand1 from "../../assets/brand1.png";
import brand2 from "../../assets/brand2.png";
import brand3 from "../../assets/brand3.png";
import { Strelka, Strelka2 } from "../icons";
import {
  BrandsContainer,
  BrandsHeader,
  BrandsTitle,
  ArrowContainer,
  BrandCardsContainer,
  BrandCard,
  BrandImage,
} from "./Brands.styled";

function Brands() {
  const brands = [
    { id: 1, image: brand1, alt: "Brand 1" },
    { id: 2, image: brand2, alt: "Brand 2" },
    { id: 3, image: brand3, alt: "Brand 3" },
    { id: 4, image: brand1, alt: "Brand 4" },
  ];

  return (
    <BrandsContainer>
      <BrandsHeader>
        <BrandsTitle>Только проверенные бренды</BrandsTitle>
        <ArrowContainer>
          <Strelka />
          <Strelka2 />
        </ArrowContainer>
      </BrandsHeader>

      <BrandCardsContainer>
        {brands.map((brand) => (
          <BrandCard key={brand.id}>
            <BrandImage src={brand.image} alt={brand.alt} />
          </BrandCard>
        ))}
      </BrandCardsContainer>
    </BrandsContainer>
  );
}

export default Brands;
