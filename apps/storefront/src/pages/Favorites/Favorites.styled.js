import styled from "styled-components";
import { Link } from "react-router-dom";

export const ManageProductContainer = styled.div`
  margin: 40px 200px;

  @media screen and (max-width: 1440px) {
    margin: 40px 150px;
  }

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
  flex-direction: column;
  justify-content: space-between;
  align-items: start;
  gap: 40px;
  margin-bottom: 30px;

  .uvo {
    position: relative;
    display: inline-block;

    h1 {
      font-size: 64px;
      color: rgba(69, 69, 69, 1);
      font-weight: 700;
      margin: 0;
      line-height: 1.2;

      @media screen and (max-width: 1440px) {
        font-size: 56px;
      }

      @media screen and (max-width: 1024px) {
        font-size: 48px;
      }

      @media screen and (max-width: 768px) {
        font-size: 40px;
      }

      @media screen and (max-width: 480px) {
        font-size: 32px;
      }

      @media screen and (max-width: 375px) {
        font-size: 28px;
      }
    }

    .uvo-2 {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      font-size: 12px;
      padding: 5px;
      border-radius: 100%;
      color: white;
      background-color: rgba(198, 60, 60, 1);
      position: absolute;
      top: 10px;
      right: -30px;

      span {
        font-weight: 500;
      }

      @media screen and (max-width: 1440px) {
        top: 8px;
        right: -28px;
        width: 22px;
        height: 22px;
        font-size: 11px;
      }

      @media screen and (max-width: 1024px) {
        top: 6px;
        right: -25px;
        width: 20px;
        height: 20px;
        font-size: 10px;
      }

      @media screen and (max-width: 768px) {
        top: 5px;
        right: -22px;
        width: 18px;
        height: 18px;
        font-size: 9px;
      }

      @media screen and (max-width: 480px) {
        top: 3px;
        right: -20px;
        width: 16px;
        height: 16px;
        font-size: 8px;
        padding: 4px;
      }

      @media screen and (max-width: 375px) {
        top: 2px;
        right: -18px;
        width: 14px;
        height: 14px;
        font-size: 7px;
        padding: 3px;
      }
    }
  }

  @media screen and (max-width: 768px) {
    gap: 30px;
    margin-bottom: 25px;
  }

  @media screen and (max-width: 480px) {
    gap: 20px;
    margin-bottom: 20px;
  }
`;

export const ProductSubtitle = styled.h2`
  color: rgba(69, 69, 69, 1);
  font-size: 25px;
  margin: 0 0 30px 0;

  @media screen and (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 25px;
  }

  @media screen and (max-width: 480px) {
    font-size: 20px;
    text-align: left;
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
    padding: 10px 20px;
    font-size: 14px;
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
    display: block;
  }

  @media screen and (max-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  @media screen and (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  @media screen and (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
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
    z-index: 2;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  @media screen and (max-width: 1440px) {
    padding: 15px 12px;
  }

  @media screen and (max-width: 1024px) {
    padding: 15px 12px;

    .heart-icon {
      top: 12px;
      right: 12px;

      svg {
        width: 22px;
        height: 22px;
      }
    }
  }

  @media screen and (max-width: 768px) {
    padding: 12px 10px;

    .heart-icon {
      top: 10px;
      right: 10px;

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  @media screen and (max-width: 480px) {
    padding: 10px 8px;
    border-radius: 12px;

    .heart-icon {
      top: 8px;
      right: 8px;

      svg {
        width: 18px;
        height: 18px;
      }
    }
  }

  @media screen and (max-width: 375px) {
    padding: 8px 6px;

    .heart-icon {
      top: 6px;
      right: 6px;

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
`;

export const ProductImage = styled.img`
  width: 153px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 15px;

  @media screen and (max-width: 1440px) {
    width: 140px;
    height: 180px;
  }

  @media screen and (max-width: 1024px) {
    width: 130px;
    height: 170px;
    margin-bottom: 12px;
  }

  @media screen and (max-width: 768px) {
    width: 120px;
    height: 160px;
    margin-bottom: 10px;
  }

  @media screen and (max-width: 480px) {
    width: 100px;
    height: 130px;
    margin-bottom: 8px;
  }

  @media screen and (max-width: 375px) {
    width: 80px;
    height: 100px;
    margin-bottom: 6px;
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

  @media screen and (max-width: 1440px) {
    font-size: 17px;
    min-height: 45px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 16px;
    min-height: 40px;
    margin-bottom: 12px;
  }

  @media screen and (max-width: 768px) {
    font-size: 15px;
    min-height: 35px;
    margin-bottom: 10px;
  }

  @media screen and (max-width: 480px) {
    font-size: 14px;
    min-height: 40px;
    margin-bottom: 8px;
  }

  @media screen and (max-width: 375px) {
    font-size: 12px;
    min-height: 35px;
    margin-bottom: 6px;
  }
`;

export const ProductCardFooter = styled.div`
  width: 100%;
  display: flex;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;

  @media screen and (max-width: 1024px) {
    gap: 12px;
  }

  @media screen and (max-width: 768px) {
    gap: 10px;
  }

  @media screen and (max-width: 480px) {
    gap: 8px;
  }
`;

export const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;

  @media screen and (max-width: 480px) {
    gap: 3px;
  }
`;

export const OldPrice = styled.del`
  font-size: 12px;
  color: rgba(159, 159, 159, 1);
  text-decoration: line-through;

  @media screen and (max-width: 480px) {
    font-size: 10px;
  }

  @media screen and (max-width: 375px) {
    font-size: 9px;
  }
`;

export const NewPrice = styled.p`
  font-size: 22px;
  color: rgba(69, 69, 69, 1);
  font-weight: 600;
  margin: 0;

  @media screen and (max-width: 1440px) {
    font-size: 20px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 18px;
  }

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }

  @media screen and (max-width: 480px) {
    font-size: 15px;
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

  @media screen and (max-width: 1024px) {
    padding: 6px 12px;
    min-width: 40px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  @media screen and (max-width: 768px) {
    padding: 5px 10px;
    min-width: 35px;
    border-radius: 18px;

    svg {
      width: 12px;
      height: 12px;
    }
  }

  @media screen and (max-width: 480px) {
    padding: 4px 8px;
    min-width: 30px;
    border-radius: 15px;

    svg {
      width: 10px;
      height: 10px;
    }
  }

  @media screen and (max-width: 375px) {
    padding: 3px 6px;
    min-width: 25px;

    svg {
      width: 8px;
      height: 8px;
    }
  }
`;
