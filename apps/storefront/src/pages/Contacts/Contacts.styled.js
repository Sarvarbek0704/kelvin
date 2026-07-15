import styled from "styled-components";

export const DeliveryWrapper = styled.div`
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

export const ContentContainer = styled.div`
  display: flex;
  gap: 200px;
  margin-top: 40px;
  align-items: flex-start;

  @media screen and (max-width: 1440px) {
    gap: 80px;
  }

  @media screen and (max-width: 1024px) {
    gap: 60px;
    margin-top: 35px;
  }

  @media screen and (max-width: 768px) {
    flex-direction: column;
    gap: 40px;
    margin-top: 30px;
  }

  @media screen and (max-width: 480px) {
    gap: 30px;
    margin-top: 25px;
  }
`;

export const LeftColumn = styled.div`
  flex: 1;

  h1 {
    font-size: 64px;
    color: rgba(69, 69, 69, 1);
    font-weight: 700;
    margin: 0 0 40px 0;
    line-height: 1.2;

    @media screen and (max-width: 1440px) {
      font-size: 56px;
      margin-bottom: 35px;
    }

    @media screen and (max-width: 1024px) {
      font-size: 48px;
      margin-bottom: 30px;
    }

    @media screen and (max-width: 768px) {
      font-size: 40px;
      margin-bottom: 25px;
    }

    @media screen and (max-width: 480px) {
      font-size: 32px;
      margin-bottom: 20px;
    }

    @media screen and (max-width: 375px) {
      font-size: 28px;
    }
  }
`;

export const RightColumn = styled.div`
  flex: 1;
  padding-top: 15px;

  @media screen and (max-width: 768px) {
    padding-top: 0;
  }
`;

export const DeliverySection = styled.div`
  h2 {
    font-size: 24px;
    color: rgba(69, 69, 69, 1);
    font-weight: 600;
    margin: 0 0 20px 0;

    @media screen and (max-width: 1440px) {
      font-size: 28px;
    }

    @media screen and (max-width: 1024px) {
      font-size: 24px;
      margin-bottom: 18px;
    }

    @media screen and (max-width: 768px) {
      font-size: 22px;
      margin-bottom: 15px;
    }

    @media screen and (max-width: 480px) {
      font-size: 20px;
      margin-bottom: 12px;
    }
  }

  p {
    font-size: 16px;
    color: rgba(69, 69, 69, 1);
    line-height: 1.6;
    margin: 0 0 25px 0;

    &:last-child {
      margin-bottom: 0;
    }

    @media screen and (max-width: 1440px) {
      font-size: 17px;
    }

    @media screen and (max-width: 1024px) {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    @media screen and (max-width: 768px) {
      font-size: 15px;
      margin-bottom: 18px;
    }

    @media screen and (max-width: 480px) {
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 15px;
    }
  }
`;

export const FullWidthMap = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 60px 0;

  iframe {
    width: calc(100% - 120px);
    max-width: 1600px;
    height: 450px;
    border-radius: 15px;
    border: none;
  }

  .map-overlay {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 460px);
    max-width: 1300px;

    background: #fff;
    border-radius: 15px;
    padding: 25px 40px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;

    span {
      font-weight: 600;
      font-size: 24px;
      color: rgba(69, 69, 69, 1);
      display: block;
      margin-bottom: 6px;
    }

    p {
      font-weight: 400;
      font-size: 16px;
      color: rgba(69, 69, 69, 1);
      margin: 0;
      font-weight: 500;
    }

    button {
      padding: 14px 28px;
      border-radius: 25px;
      border: none;
      background: rgba(69, 69, 69, 1);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }
  }

  @media screen and (max-width: 1024px) {
    iframe {
      height: 350px;
      width: calc(100% - 80px);
    }

    .map-overlay {
      position: static;
      transform: none;
      margin-top: 30px;

      width: calc(100% - 80px);
      max-width: none;

      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
    }
  }

  @media screen and (max-width: 768px) {
    iframe {
      height: 300px;
      width: calc(100% - 40px);
    }

    .map-overlay {
      width: calc(100% - 40px);
      padding: 20px;
    }
  }
`;
