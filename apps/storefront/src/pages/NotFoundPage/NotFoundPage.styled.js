import styled from "styled-components";

export const NotFoundWrapper = styled.div`
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 200px;

  @media screen and (max-width: 1440px) {
    margin: 0 150px;
  }

  @media screen and (max-width: 1024px) {
    margin: 0 100px;
  }

  @media screen and (max-width: 768px) {
    margin: 0 50px;
  }

  @media screen and (max-width: 480px) {
    margin: 0 20px;
  }
`;

export const ContentWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 0;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  max-width: 600px;

  @media screen and (max-width: 768px) {
    gap: 25px;
  }

  @media screen and (max-width: 480px) {
    gap: 20px;
  }
`;

export const ErrorNumber = styled.h1`
  font-size: 350px;
  opacity: 20%;
  color: rgba(69, 69, 69, 1);
  font-weight: 700;
  margin: 0;
  line-height: 1;
  letter-spacing: 5px;

  @media screen and (max-width: 1440px) {
    font-size: 160px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 140px;
  }

  @media screen and (max-width: 768px) {
    font-size: 120px;
  }

  @media screen and (max-width: 480px) {
    font-size: 100px;
  }

  @media screen and (max-width: 375px) {
    font-size: 80px;
  }
`;

export const NotFoundTitle = styled.h2`
  font-size: 24px;
  color: rgba(69, 69, 69, 1);
  font-weight: 600;
  margin: 0;
  line-height: 1.2;

  @media screen and (max-width: 1440px) {
    font-size: 36px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 32px;
  }

  @media screen and (max-width: 768px) {
    font-size: 28px;
  }

  @media screen and (max-width: 480px) {
    font-size: 24px;
  }

  @media screen and (max-width: 375px) {
    font-size: 20px;
  }
`;

export const NotFoundMessage = styled.p`
  font-size: 24px;
  color: rgba(69, 69, 69, 1);
  line-height: 1.6;
  margin: 0;
  opacity: 0.8;

  @media screen and (max-width: 1440px) {
    font-size: 17px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 16px;
  }

  @media screen and (max-width: 768px) {
    font-size: 15px;
  }

  @media screen and (max-width: 480px) {
    font-size: 14px;
  }
`;

export const HomeButton = styled.button`
  background-color: rgba(69, 69, 69, 1);
  color: white;
  border: none;
  border-radius: 100px;
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;

  @media screen and (max-width: 768px) {
    padding: 14px 35px;
    font-size: 15px;
  }

  @media screen and (max-width: 480px) {
    padding: 12px 30px;
    font-size: 14px;
    border-radius: 8px;
  }
`;
