import styled from "styled-components";

export const ReasonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin: 40px 200px;
  padding: 40px 0;

  @media screen and (max-width: 1024px) {
    margin: 40px 100px;
    padding: 30px 0;
  }

  @media screen and (max-width: 768px) {
    margin: 30px 50px;
    padding: 25px 0;
  }

  @media screen and (max-width: 480px) {
    margin: 20px 15px;
    padding: 20px 0;
  }
`;

export const ReasonsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .link {
    text-decoration: none;
    color: inherit;
  }

  @media screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
`;

export const ReasonsTitle = styled.h1`
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
    text-align: center;
  }

  @media screen and (max-width: 375px) {
    font-size: 24px;
  }
`;

export const AboutButton = styled.button`
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

  @media screen and (max-width: 768px) {
    align-self: center;
    padding: 12px 30px;
  }

  @media screen and (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 12px;
    margin-top: 10px;
  }
`;

export const CardsContainer = styled.div`
  display: flex;
  gap: 15px;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;

  @media screen and (max-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 15px;
  }

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
  }
`;

export const Card = styled.div`
  align-items: start;
  width: 300px;
  border: 1px solid rgba(217, 217, 217, 1);
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 50px;
  background: white;

  @media screen and (max-width: 1024px) {
    width: 100%;
    padding: 40px 30px;
    gap: 40px;
  }

  @media screen and (max-width: 768px) {
    padding: 30px 20px;
    gap: 30px;
  }

  @media screen and (max-width: 480px) {
    padding: 25px 20px;
    gap: 25px;
  }

  @media screen and (max-width: 375px) {
    padding: 20px 15px;
    gap: 20px;
  }
`;

export const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: rgba(69, 69, 69, 1);
  padding: 10px;
  border-radius: 15px;

  @media screen and (max-width: 768px) {
    width: 70px;
    height: 70px;
  }

  @media screen and (max-width: 480px) {
    width: 60px;
    height: 60px;
  }

  @media screen and (max-width: 375px) {
    width: 50px;
    height: 50px;
  }
`;

export const CardText = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 30px;

  @media screen and (max-width: 1024px) {
    gap: 20px;
  }
`;

export const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
  margin: 0;
  opacity: 100%;

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: 18px;
  }

  @media screen and (max-width: 375px) {
    font-size: 16px;
  }
`;

export const CardDescription = styled.p`
  font-size: 16px;
  font-weight: 400;
  color: rgba(69, 69, 69, 1);
  margin: 0;
  opacity: 50%;

  @media screen and (max-width: 768px) {
    font-size: 15px;
  }

  @media screen and (max-width: 480px) {
    font-size: 14px;
  }

  @media screen and (max-width: 375px) {
    font-size: 13px;
  }
`;
