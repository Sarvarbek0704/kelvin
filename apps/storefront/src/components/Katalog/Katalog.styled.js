import styled from "styled-components";

export const KatalogContainer = styled.div`
  margin: 40px 200px;
  padding: 40px 0;

  @media screen and (max-width: 1023px) {
    margin: 30px 50px;
    padding: 30px 0;
  }

  @media screen and (max-width: 767px) {
    margin: 25px 20px;
    padding: 25px 0;
  }

  @media screen and (max-width: 479px) {
    margin: 20px 15px;
    padding: 20px 0;
  }
`;

export const KatalogHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;

  @media screen and (max-width: 767px) {
    margin-bottom: 25px;
  }

  @media screen and (max-width: 479px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
  }
`;

export const KatalogSubtitle = styled.h2`
  color: rgba(69, 69, 69, 1);
  font-size: 36px;
  font-weight: 700;
  margin: 0;

  @media screen and (max-width: 767px) {
    font-size: 28px;
  }

  @media screen and (max-width: 479px) {
    font-size: 24px;
  }
`;

export const KatalogMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 20px;

  @media screen and (max-width: 1023px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, auto);
    gap: 15px;
  }

  @media screen and (max-width: 479px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, auto);
    gap: 10px;
  }
`;

export const CategoryCard = styled.div`
  background-color: rgba(242, 242, 242, 1);
  border-radius: 20px;
  padding: 30px;

  @media screen and (max-width: 1023px) {
    padding: 20px;
  }

  @media screen and (max-width: 767px) {
    padding: 20px 15px;
    border-radius: 15px;
  }

  @media screen and (max-width: 479px) {
    padding: 15px;
  }

  &:nth-child(1) {
    @media screen and (max-width: 1023px) {
      grid-row: 1;
      grid-column: 1;
    }
    @media screen and (max-width: 479px) {
      grid-row: 1;
      grid-column: 1;
    }
  }

  &:nth-child(2) {
    @media screen and (max-width: 1023px) {
      grid-row: 2;
      grid-column: 1;
    }
    @media screen and (max-width: 479px) {
      grid-row: 2;
      grid-column: 1;
    }
  }

  &:nth-child(3) {
    @media screen and (max-width: 1023px) {
      grid-row: 1;
      grid-column: 2;
    }
    @media screen and (max-width: 479px) {
      grid-row: 3;
      grid-column: 1;
    }
  }

  &:nth-child(4) {
    @media screen and (max-width: 1023px) {
      grid-row: 2;
      grid-column: 2;
    }
    @media screen and (max-width: 479px) {
      grid-row: 4;
      grid-column: 1;
    }
  }

  &:nth-child(5) {
    @media screen and (max-width: 1023px) {
      grid-row: 3;
      grid-column: 1;
    }
    @media screen and (max-width: 479px) {
      grid-row: 5;
      grid-column: 1;
    }
  }

  &:nth-child(6) {
    @media screen and (max-width: 1023px) {
      grid-row: 3;
      grid-column: 2;
    }
    @media screen and (max-width: 479px) {
      grid-row: 6;
      grid-column: 1;
    }
  }
`;

export const CategoryContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;

  @media screen and (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  @media screen and (max-width: 479px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const CategoryText = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 60px;

  @media screen and (max-width: 1023px) {
    gap: 40px;
  }

  @media screen and (max-width: 767px) {
    gap: 20px;
    width: 100%;
  }
`;

export const CategoryTitle = styled.h3`
  color: rgba(69, 69, 69, 1);
  font-size: 20px;
  font-weight: 500;

  @media screen and (max-width: 1023px) {
    font-size: 18px;
  }

  @media screen and (max-width: 479px) {
    font-size: 16px;
  }
`;

export const CategoryLink = styled.a`
  color: rgba(69, 69, 69, 1);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;

  @media screen and (max-width: 479px) {
    font-size: 14px;
  }
`;

export const CategoryIcon = styled.div`
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 1023px) {
    width: 100px;
    height: 100px;
  }

  @media screen and (max-width: 767px) {
    width: 100px;
    height: 100px;
    margin-top: 10px;
  }

  @media screen and (max-width: 479px) {
    width: 70px;
    height: 70px;
    margin-top: 0;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

export const HammaKatalog = styled.button`
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

  .link {
    text-decoration: none;
    color: rgba(69, 69, 69, 1);
  }

  @media screen and (max-width: 1023px) {
    padding: 12px 30px;
  }

  @media screen and (max-width: 767px) {
    padding: 10px 20px;
    font-size: 14px;

    img {
      width: 12px;
      height: 12px;
    }
  }

  @media screen and (max-width: 479px) {
    width: 100%;
    justify-content: center;
    padding: 12px;
  }
`;
