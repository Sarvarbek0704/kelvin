import styled from "styled-components";
import { Link } from "react-router-dom";

export const ManageProductContainer = styled.div`
  margin: 40px 200px;

  @media screen and (max-width: 1024px) {
    margin: 40px 100px;
  }

  @media screen and (max-width: 768px) {
    margin: 30px 50px;
  }

  @media screen and (max-width: 480px) {
    margin: 25px 20px;
  }

  @media screen and (max-width: 375px) {
    margin: 20px 15px;
  }
`;

export const ProductHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

export const ProductSubtitle = styled.h2`
  color: rgba(69, 69, 69, 1);
  font-size: 25px;
  font-weight: 500;
  margin: 0 0 30px 0;

  @media screen and (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 25px;
  }

  @media screen and (max-width: 480px) {
    font-size: 20px;
    text-align: center;
    margin-bottom: 20px;
  }
`;

export const AllProductsLink = styled(Link)`
  text-decoration: none;
`;

export const AllProductsButton = styled.button`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 47px;
  border-radius: 100px;
  color: rgba(69, 69, 69, 1);
  background: none;
  border: 1px solid rgba(69, 69, 69, 1);
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;

  img {
    width: 16px;
    height: 16px;
  }

  @media screen and (max-width: 1024px) {
    padding: 12px 30px;
  }

  @media screen and (max-width: 768px) {
    padding: 10px 25px;
  }

  @media screen and (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

export const ProductCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  width: 100%;

  .link {
    text-decoration: none;
    color: inherit;
  }

  @media screen and (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media screen and (max-width: 375px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  @media screen and (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const ProductCard = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-radius: 15px;
  background: white;
  height: 100%;
  position: relative;

  .heart-icon {
    position: absolute;
    top: 15px;
    right: 15px;
  }
  @media screen and (max-width: 1024px) {
    padding: 15px 12px;
  }

  @media screen and (max-width: 768px) {
    padding: 15px 12px;
  }

  @media screen and (max-width: 480px) {
    padding: 12px 10px;
    border-radius: 12px;
  }

  @media screen and (max-width: 375px) {
    padding: 10px 8px;
  }
`;

export const ProductImage = styled.img`
  width: 153px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 15px;

  @media screen and (max-width: 1024px) {
    width: 140px;
    height: 180px;
  }

  @media screen and (max-width: 768px) {
    width: 130px;
    height: 170px;
  }

  @media screen and (max-width: 480px) {
    width: 110px;
    height: 140px;
  }

  @media screen and (max-width: 375px) {
    width: 90px;
    height: 120px;
  }
`;

export const ProductTitle = styled.p`
  font-size: 18px;
  color: rgba(69, 69, 69, 1);
  text-align: center;
  margin: 0 0 15px 0;
  line-height: 1.4;
  font-weight: 500;
  width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 1024px) {
    font-size: 16px;
    min-height: 45px;
  }

  @media screen and (max-width: 768px) {
    font-size: 15px;
    min-height: 40px;
  }

  @media screen and (max-width: 480px) {
    font-size: 14px;
    min-height: 60px;
    line-height: 1.3;
  }

  @media screen and (max-width: 375px) {
    font-size: 12px;
    min-height: 50px;
  }
`;

export const ProductCardFooter = styled.div`
  width: 100%;
  display: flex;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;

  @media screen and (max-width: 768px) {
    gap: 10px;
  }

  @media screen and (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
`;

export const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;

  @media screen and (max-width: 480px) {
    align-items: center;
  }
`;

export const OldPrice = styled.del`
  font-size: 12px;
  color: rgba(159, 159, 159, 1);
  text-decoration: line-through;

  @media screen and (max-width: 480px) {
    font-size: 11px;
  }
`;

export const NewPrice = styled.p`
  font-size: 22px;
  color: rgba(69, 69, 69, 1);
  font-weight: 600;
  margin: 0;

  @media screen and (max-width: 1024px) {
    font-size: 20px;
  }

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: 16px;
    text-align: center;
  }

  @media screen and (max-width: 375px) {
    font-size: 14px;
  }
`;

export const CartButton = styled.div`
  background-color: rgba(69, 69, 69, 1);
  padding: 7px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 45px;

  svg {
    width: 16px;
    height: 16px;
  }

  @media screen and (max-width: 768px) {
    padding: 8px 12px;
  }

  @media screen and (max-width: 480px) {
    padding: 8px;
    width: 100%;
    border-radius: 15px;
  }

  @media screen and (max-width: 375px) {
    padding: 6px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;
