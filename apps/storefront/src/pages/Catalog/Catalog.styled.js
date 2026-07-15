import styled from "styled-components";

export const CatalogWrapper = styled.div`
  margin: 40px 200px;

  @media screen and (max-width: 1440px) {
    margin: 40px 150px;
  }

  @media screen and (max-width: 1024px) {
    margin: 30px 100px;
  }

  @media screen and (max-width: 768px) {
    margin: 25px 50px;
  }

  @media screen and (max-width: 480px) {
    margin: 20px 20px;
  }

  @media screen and (max-width: 375px) {
    margin: 15px 15px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;

    @media screen and (max-width: 1024px) {
      margin-bottom: 35px;
    }

    @media screen and (max-width: 768px) {
      margin-bottom: 30px;
      gap: 10px;
    }

    @media screen and (max-width: 480px) {
      margin-bottom: 25px;
      gap: 8px;
    }

    .breadcrumb-header {
      display: flex;
      gap: 10px;

      @media screen and (max-width: 480px) {
        gap: 8px;
      }
    }
  }

  .a {
    color: inherit;
    text-decoration: none;
    font-size: 14px;

    @media screen and (max-width: 768px) {
      font-size: 13px;
    }

    @media screen and (max-width: 480px) {
      font-size: 12px;
    }
  }

  .catalogGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    justify-content: center;
    margin-top: 20px;

    @media screen and (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
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
  }

  .catalogGrid2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    justify-content: center;
    padding-top: 20px;

    @media screen and (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      padding-top: 15px;
    }

    @media screen and (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding-top: 12px;
    }

    @media screen and (max-width: 375px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
  }

  .catalogCard {
    width: 100%;
    height: 250px;
    background: #f5f5f5;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-evenly;

    @media screen and (max-width: 1440px) {
      height: 220px;
    }

    @media screen and (max-width: 1024px) {
      height: 200px;
      border-radius: 16px;
    }

    @media screen and (max-width: 768px) {
      height: 180px;
      border-radius: 14px;
      justify-content: space-between;
      padding: 0 20px;
    }

    @media screen and (max-width: 480px) {
      height: 160px;
      border-radius: 12px;
      padding: 0 15px;
    }

    @media screen and (max-width: 375px) {
      height: 140px;
      padding: 0 12px;
    }
  }

  .catalogCard > div {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px 0 32px 32px;
    height: 200px;
    width: 245px;

    @media screen and (max-width: 1440px) {
      height: 180px;
      width: 220px;
      padding: 25px 0 25px 25px;
    }

    @media screen and (max-width: 1024px) {
      height: 160px;
      width: 200px;
      padding: 20px 0 20px 20px;
    }

    @media screen and (max-width: 768px) {
      height: 140px;
      width: auto;
      flex: 1;
      padding: 15px 0 15px 15px;
    }

    @media screen and (max-width: 480px) {
      height: 120px;
      padding: 10px 0 10px 10px;
    }

    @media screen and (max-width: 375px) {
      padding: 8px 0 8px 8px;
    }
  }

  .catalogCard > div > p:nth-child(2) {
    font-size: 14px;
    margin-top: auto;

    @media screen and (max-width: 1024px) {
      font-size: 13px;
    }

    @media screen and (max-width: 480px) {
      font-size: 12px;
    }
  }

  .catalogText {
    font-size: 20px;
    font-weight: 500;

    @media screen and (max-width: 1440px) {
      font-size: 18px;
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

    @media screen and (max-width: 375px) {
      font-size: 13px;
    }
  }

  .catalogCard img {
    max-width: 180px;
    max-height: 180px;
    width: auto;
    height: auto;
    object-fit: contain;

    @media screen and (max-width: 1440px) {
      max-width: 160px;
      max-height: 160px;
    }

    @media screen and (max-width: 1024px) {
      max-width: 140px;
      max-height: 140px;
    }

    @media screen and (max-width: 768px) {
      max-width: 120px;
      max-height: 120px;
    }

    @media screen and (max-width: 480px) {
      max-width: 100px;
      max-height: 100px;
    }

    @media screen and (max-width: 375px) {
      max-width: 80px;
      max-height: 80px;
    }
  }
`;
