import styled from "styled-components";

export const AboutUsWrapper = styled.div`
  margin: 60px 200px;

  @media screen and (max-width: 1440px) {
    margin: 50px 150px;
  }

  @media screen and (max-width: 1024px) {
    margin: 40px 100px;
  }

  @media screen and (max-width: 768px) {
    margin: 30px 50px;
  }

  @media screen and (max-width: 480px) {
    margin: 20px 20px;
  }
`;

export const BreadcrumbLink = styled.a`
  text-decoration: none;
  color: rgba(69, 69, 69, 1);
  opacity: 40%;
  font-size: 14px;

  @media screen and (max-width: 480px) {
    font-size: 12px;
  }
`;

export const BreadcrumbSpan = styled.span`
  color: rgba(69, 69, 69, 1);
  font-size: 14px;

  @media screen and (max-width: 480px) {
    font-size: 12px;
  }
`;

export const AboutUsMain = styled.div`
  display: flex;
  gap: 155px;
  margin-top: 20px;

  @media screen and (max-width: 1440px) {
    gap: 100px;
  }

  @media screen and (max-width: 1024px) {
    gap: 60px;
  }

  @media screen and (max-width: 768px) {
    flex-direction: column;
    gap: 40px;
  }

  @media screen and (max-width: 480px) {
    gap: 30px;
    margin-top: 15px;
  }
`;

export const MainLeft = styled.div`
  width: 36%;
  display: flex;
  flex-direction: column;
  gap: 30px;

  @media screen and (max-width: 1024px) {
    width: 40%;
  }

  @media screen and (max-width: 768px) {
    width: 100%;
    gap: 25px;
  }

  @media screen and (max-width: 480px) {
    gap: 20px;
  }
`;

export const MainRight = styled.div`
  width: 50%;

  @media screen and (max-width: 1024px) {
    width: 60%;
  }

  @media screen and (max-width: 768px) {
    width: 100%;
  }
`;

export const AboutUsTitle = styled.h1`
  font-weight: 700;
  font-size: 64px;
  color: rgba(69, 69, 69, 1);
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
`;

export const LeftCardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media screen and (max-width: 480px) {
    gap: 15px;
  }
`;

export const LeftCard = styled.div`
  padding: 30px;
  border-radius: 15px;
  background-color: rgba(242, 242, 242, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;

  h1 {
    font-size: 48px;
    color: rgba(69, 69, 69, 1);
    margin: 0;
    font-weight: 700;
    line-height: 1;

    @media screen and (max-width: 1440px) {
      font-size: 42px;
    }

    @media screen and (max-width: 1024px) {
      font-size: 36px;
    }

    @media screen and (max-width: 768px) {
      font-size: 32px;
    }

    @media screen and (max-width: 480px) {
      font-size: 28px;
    }
  }

  p {
    font-size: 16px;
    color: rgba(69, 69, 69, 1);
    margin: 0;
    line-height: 1.4;

    @media screen and (max-width: 1024px) {
      font-size: 15px;
    }

    @media screen and (max-width: 480px) {
      font-size: 14px;
    }
  }

  @media screen and (max-width: 1440px) {
    padding: 25px;
    min-height: 140px;
  }

  @media screen and (max-width: 1024px) {
    padding: 20px;
    min-height: 130px;
  }

  @media screen and (max-width: 768px) {
    padding: 25px;
    min-height: 140px;
  }

  @media screen and (max-width: 480px) {
    padding: 20px;
    min-height: 120px;
    border-radius: 12px;
  }
`;

export const RightCardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;

  @media screen and (max-width: 768px) {
    padding: 0;
  }

  @media screen and (max-width: 480px) {
    gap: 15px;
  }
`;

export const RightCard = styled.div`
  padding: 10px;

  p {
    font-size: 16px;
    color: rgba(69, 69, 69, 1);
    line-height: 1.6;
    margin: 0;
    text-align: justify;

    @media screen and (max-width: 1024px) {
      font-size: 15px;
      line-height: 1.5;
    }

    @media screen and (max-width: 480px) {
      font-size: 14px;
      line-height: 1.4;
    }
  }

  @media screen and (max-width: 480px) {
    padding: 5px;
  }
`;
