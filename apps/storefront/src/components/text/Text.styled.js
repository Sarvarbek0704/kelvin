import styled from "styled-components";

export const TextContainer = styled.div`
  display: flex;
  gap: 150px;
  margin: 40px 200px;
  padding: 40px 0;
  color: rgba(69, 69, 69, 1);

  @media screen and (max-width: 1024px) {
    margin: 40px 100px;
    padding: 30px 0;
    gap: 80px;
  }

  @media screen and (max-width: 768px) {
    margin: 30px 50px;
    padding: 25px 0;
    gap: 50px;
    flex-direction: column;
  }

  @media screen and (max-width: 480px) {
    margin: 25px 20px;
    padding: 20px 0;
    gap: 30px;
  }

  @media screen and (max-width: 375px) {
    margin: 20px 15px;
    padding: 15px 0;
    gap: 25px;
  }

  @media screen and (min-width: 1440px) {
    margin: 40px 250px;
    gap: 180px;
  }

  @media screen and (max-width: 900px) and (orientation: landscape) {
    margin: 25px 40px;
    padding: 20px 0;
    gap: 40px;
  }
`;

export const TextTitleContainer = styled.div`
  flex: 1;
`;

export const TextTitle = styled.h1`
  font-weight: 700;
  font-size: 40px;
  margin: 0;
  line-height: 1.2;

  @media screen and (max-width: 1024px) {
    font-size: 36px;
  }

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }

  @media screen and (max-width: 480px) {
    font-size: 28px;
    text-align: center;
  }

  @media screen and (max-width: 375px) {
    font-size: 24px;
  }

  @media screen and (min-width: 1440px) {
    font-size: 44px;
  }

  @media screen and (max-width: 900px) and (orientation: landscape) {
    font-size: 30px;
  }
`;

export const TextParagraphContainer = styled.div`
  flex: 1;
`;

export const TextParagraph = styled.p`
  font-weight: 500;
  font-size: 20px;
  margin: 0;
  line-height: 1.6;

  @media screen and (max-width: 1024px) {
    font-size: 18px;
  }

  @media screen and (max-width: 768px) {
    font-size: 17px;
    line-height: 1.5;
  }

  @media screen and (max-width: 480px) {
    font-size: 16px;
    line-height: 1.5;
    text-align: justify;
  }

  @media screen and (max-width: 375px) {
    font-size: 15px;
  }

  @media screen and (min-width: 1440px) {
    font-size: 22px;
  }

  @media screen and (max-width: 900px) and (orientation: landscape) {
    font-size: 16px;
  }
`;
