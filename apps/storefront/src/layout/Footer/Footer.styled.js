import styled from "styled-components";

export const FooterWrapper = styled.footer`
  padding: 40px 200px;
  background-color: rgba(242, 242, 242, 1);
  display: flex;
  gap: 150px;
  color: rgba(69, 69, 69, 1);

  @media screen and (max-width: 1024px) {
    padding: 40px 100px;
    gap: 80px;
    flex-wrap: wrap;
  }

  @media screen and (max-width: 768px) {
    padding: 30px 50px;
    gap: 50px;
    flex-direction: column;
  }

  @media screen and (max-width: 480px) {
    padding: 25px 20px;
    gap: 40px;
  }

  @media screen and (max-width: 375px) {
    padding: 20px 15px;
    gap: 30px;
  }

  @media screen and (min-width: 1440px) {
    padding: 50px 250px;
    gap: 180px;
  }
`;

export const FooterSectionOne = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-width: 200px;

  @media screen and (max-width: 1024px) {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 30px;
    margin-bottom: 40px;
  }

  @media screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 30px;
  }

  @media screen and (max-width: 480px) {
    align-items: left;
    text-align: center;
    gap: 15px;
  }
`;

export const LogoFooter = styled.img`
  height: 50px;
  width: auto;
  object-fit: contain;

  @media screen and (max-width: 1024px) {
    order: 1;
  }

  @media screen and (max-width: 768px) {
    order: 1;
    height: 40px;
  }

  @media screen and (max-width: 480px) {
    height: 35px;
  }

  @media screen and (max-width: 375px) {
    height: 30px;
  }
`;

export const FooterPhone = styled.a`
  text-decoration: none;
  font-size: 20px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
  margin-bottom: 10px;

  @media screen and (max-width: 1024px) {
    order: 2;
    font-size: 22px;
  }

  @media screen and (max-width: 768px) {
    order: 2;
    font-size: 20px;
  }

  @media screen and (max-width: 480px) {
    font-size: 18px;
  }

  @media screen and (max-width: 375px) {
    font-size: 16px;
  }
`;

export const PaymentLogos = styled.img`
  width: 200px;
  height: auto;
  object-fit: contain;

  @media screen and (max-width: 1024px) {
    order: 3;
    width: 180px;
  }

  @media screen and (max-width: 768px) {
    order: 4;
    width: 160px;
  }

  @media screen and (max-width: 480px) {
    width: 140px;
  }

  @media screen and (max-width: 375px) {
    width: 120px;
  }
`;

export const FooterLink = styled.a`
  color: rgba(69, 69, 69, 1);
  font-size: 16px;
  font-weight: 600;
  opacity: 50%;
  text-decoration: none;

  &:nth-of-type(1) {
    @media screen and (max-width: 1024px) {
      order: 4;
    }
  }

  &:nth-of-type(2) {
    @media screen and (max-width: 1024px) {
      order: 4;
    }
  }

  @media screen and (max-width: 375px) {
    font-size: 14px;
  }
`;

export const VkIconsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;

  @media screen and (max-width: 1024px) {
    order: 5;
    margin-top: 0;
  }

  @media screen and (max-width: 768px) {
    order: 3;
    margin-top: 0;
  }

  @media screen and (max-width: 480px) {
    justify-content: center;
  }
`;

export const FooterSectionTwo = styled.div`
  white-space: nowrap;
  width: max-content;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-width: 150px;

  @media screen and (max-width: 1024px) {
    min-width: auto;
    flex: 1;
  }

  @media screen and (max-width: 768px) {
    width: 100%;
  }

  @media screen and (max-width: 480px) {
    align-items: left;
    text-align: left;
  }
`;

export const FooterSectionThree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 2;
  min-width: 300px;

  @media screen and (max-width: 1024px) {
    min-width: auto;
    flex: 1;
  }

  @media screen and (max-width: 768px) {
    width: 100%;
  }

  @media screen and (max-width: 480px) {
    align-items: left;
    text-align: left;
  }
`;

export const FooterTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: rgba(69, 69, 69, 1);

  @media screen and (max-width: 375px) {
    font-size: 18px;
  }
`;

export const SectionTwoLink = styled.a`
  text-decoration: none;
  font-size: 16px;
  color: rgba(69, 69, 69, 1);
  opacity: 50%;

  @media screen and (max-width: 375px) {
    font-size: 14px;
    white-space: normal;
    text-align: left;
  }
`;

export const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    width: 100%;
  }
`;

export const ProductLink = styled.a`
  text-decoration: none;
  font-size: 16px;
  color: rgba(69, 69, 69, 1);
  opacity: 50%;
  white-space: nowrap;

  @media screen and (max-width: 480px) {
    white-space: normal;
    text-align: left;
    padding: 5px 0;
  }

  @media screen and (max-width: 375px) {
    font-size: 14px;
  }
`;
