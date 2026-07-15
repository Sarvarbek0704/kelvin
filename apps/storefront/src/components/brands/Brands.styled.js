import styled from "styled-components";

export const BrandsContainer = styled.div`
  margin: 60px 200px;

  @media screen and (max-width: 1024px) {
    margin: 50px 100px;
  }

  @media screen and (max-width: 768px) {
    margin: 40px 50px;
  }

  @media screen and (max-width: 480px) {
    margin: 30px 20px;
  }

  @media screen and (max-width: 375px) {
    margin: 25px 15px;
  }
`;

export const BrandsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  @media screen and (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 15px;
  }
`;

export const BrandsTitle = styled.h1`
  color: rgba(69, 69, 69, 1);
  font-size: 40px;
  font-weight: 700;
  margin: 0;

  @media screen and (max-width: 1024px) {
    font-size: 36px;
  }

  @media screen and (max-width: 768px) {
    font-size: 32px;
    width: 100%;
  }

  @media screen and (max-width: 480px) {
    font-size: 28px;
    width: 100%;
  }

  @media screen and (max-width: 375px) {
    font-size: 24px;
  }
`;

export const ArrowContainer = styled.div`
  display: flex;
  gap: 10px;

  @media screen and (max-width: 768px) {
    align-self: flex-end;
  }

  @media screen and (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

export const BrandCardsContainer = styled.div`
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  width: 100%;

  @media screen and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 20px;
    margin-top: 40px;
  }

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 30px;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 25px;
  }

  @media screen and (max-width: 375px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  @media screen and (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media screen and (max-width: 900px) and (orientation: landscape) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const BrandCard = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(217, 217, 217, 0.9);
  padding: 20px;
  background: white;
  height: 120px;
  overflow: hidden;

  @media screen and (max-width: 1024px) {
    height: 110px;
    padding: 15px;
  }

  @media screen and (max-width: 768px) {
    height: 100px;
    padding: 15px 20px;
  }

  @media screen and (max-width: 480px) {
    height: 90px;
    padding: 12px 15px;
  }

  @media screen and (max-width: 375px) {
    height: 80px;
    padding: 10px 15px;
  }

  @media screen and (min-width: 1440px) {
    height: 140px;
  }

  @media screen and (max-width: 900px) and (orientation: landscape) {
    height: 80px;
    padding: 10px;
  }
`;

export const BrandImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(62%) opacity(1);

  @media screen and (max-width: 480px) {
    max-height: 60px;
  }

  @media screen and (max-width: 375px) {
    max-height: 50px;
  }
`;
