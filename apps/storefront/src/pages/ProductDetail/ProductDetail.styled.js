import styled from "styled-components";

export const ProductDetailWrapper = styled.div`
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

export const DetailCard = styled.div`
  display: flex;
  gap: 60px;
  margin-top: 40px;

  @media screen and (max-width: 1440px) {
    gap: 40px;
  }

  @media screen and (max-width: 1024px) {
    gap: 30px;
  }

  @media screen and (max-width: 768px) {
    flex-direction: column;
    gap: 25px;
  }

  @media screen and (max-width: 480px) {
    gap: 20px;
    margin-top: 25px;
  }
`;

export const ImageGallery = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;

  @media screen and (max-width: 768px) {
    width: 100%;
  }
`;

export const MainImage = styled.img`
  border: 1px solid rgba(221, 221, 221, 1);
  width: 100%;
  height: 500px;
  object-fit: contain;
  border-radius: 8px;

  @media screen and (max-width: 1440px) {
    height: 450px;
  }

  @media screen and (max-width: 1024px) {
    height: 400px;
  }

  @media screen and (max-width: 768px) {
    height: 350px;
  }

  @media screen and (max-width: 480px) {
    height: 250px;
  }

  @media screen and (max-width: 375px) {
    height: 200px;
  }
`;

export const ThumbnailContainer = styled.div`
  display: none;

  @media screen and (max-width: 480px) {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

export const Thumbnail = styled.img`
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 1px solid rgba(221, 221, 221, 1);
  border-radius: 5px;

  @media screen and (max-width: 375px) {
    width: 60px;
    height: 60px;
  }
`;

export const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  flex: 1;

  @media screen and (max-width: 480px) {
    gap: 20px;
  }
`;

export const Title = styled.div`
  h1 {
    font-size: 40px;
    color: rgba(69, 69, 69, 1);
    margin: 0;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;

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
      text-align: left;
    }
  }
`;

export const DataCenter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;

  p {
    color: rgba(179, 179, 179, 1);
    margin: 0;
    font-size: 16px;
    text-align: left;

    @media screen and (max-width: 480px) {
      font-size: 14px;
      text-align: left;
    }
  }
`;

export const IconsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  @media screen and (max-width: 768px) {
    flex-direction: row;
    gap: 15px;
    justify-content: space-between;
  }

  @media screen and (max-width: 480px) {
    gap: 10px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const IconsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  svg {
    width: 24px;
    height: 24px;

    @media screen and (max-width: 480px) {
      width: 20px;
      height: 20px;
    }
  }

  @media screen and (max-width: 480px) {
    margin-top: 5px;
  }
`;

export const InStockText = styled.p`
  font-weight: 400;
  color: rgba(77, 147, 44, 1) !important;
  font-size: 16px;
  text-align: left;

  @media screen and (max-width: 480px) {
    font-size: 14px;
    text-align: left;
  }
`;

export const PriceContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  @media screen and (max-width: 480px) {
    justify-content: flex-start;
  }
`;

export const CurrentPrice = styled.h1`
  font-weight: 500;
  color: rgba(16, 16, 16, 1);
  font-size: 36px;
  margin: 0;
  text-align: left;

  @media screen and (max-width: 1440px) {
    font-size: 32px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 28px;
  }

  @media screen and (max-width: 480px) {
    font-size: 24px;
  }
`;

export const OldPrice = styled.del`
  color: rgba(179, 179, 179, 1);
  font-size: 18px;
  text-align: left;

  @media screen and (max-width: 1440px) {
    font-size: 20px;
  }

  @media screen and (max-width: 480px) {
    font-size: 18px;
  }
`;

export const InfoText = styled.div`
  p {
    font-weight: 400;
    color: rgba(76, 76, 76, 1);
    font-size: 16px;
    line-height: 1.6;
    margin: 0;
    text-align: left;

    @media screen and (max-width: 480px) {
      font-size: 14px;
      text-align: left;
    }
  }
`;

export const DetailFooter = styled.div`
  display: flex;
  gap: 20px;
  align-items: stretch;

  @media screen and (max-width: 768px) {
    flex-wrap: nowrap;
  }

  @media screen and (max-width: 480px) {
    flex-direction: row;
    gap: 15px;
    align-items: center;
  }
`;

export const Counter = styled.div`
  text-align: center;
  border: 1px solid rgba(229, 229, 229, 1);
  border-radius: 10px;
  padding: 10px 20px;
  letter-spacing: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;

  p {
    margin: 0;
    font-size: 18px;
    color: rgba(69, 69, 69, 1);
    font-weight: 500;
  }

  @media screen and (max-width: 1440px) {
    min-width: 100px;
    padding: 8px 15px;
  }

  @media screen and (max-width: 480px) {
    flex: 1;
    padding: 10px 15px;
  }
`;

export const AddToCartButton = styled.button`
  border: none;
  color: white;
  background-color: rgba(69, 69, 69, 1);
  border-radius: 10px;
  padding: 0 45px;
  font-size: 16px;
  font-weight: 500;

  @media screen and (max-width: 1440px) {
    padding: 0 35px;
  }

  @media screen and (max-width: 768px) {
    flex: 2;
  }

  @media screen and (max-width: 480px) {
    display: none;
  }
`;

export const HeartIconWrapper = styled.div`
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: rgba(248, 248, 248, 1);
  min-width: 60px;

  svg {
    width: 24px;
    height: 24px;
  }

  @media screen and (max-width: 480px) {
    min-width: 50px;
    padding: 10px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

export const MainContent = styled.div`
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  gap: 30px;

  h1 {
    color: rgba(69, 69, 69, 1);
    font-size: 28px;
    font-weight: 500;
    margin: 0;
    text-align: left;

    @media screen and (max-width: 1440px) {
      font-size: 26px;
    }

    @media screen and (max-width: 768px) {
      font-size: 24px;
    }

    @media screen and (max-width: 480px) {
      font-size: 20px;
      text-align: left;
    }
  }

  @media screen and (max-width: 1440px) {
    margin-top: 40px;
  }

  @media screen and (max-width: 768px) {
    margin-top: 35px;
  }

  @media screen and (max-width: 480px) {
    margin-top: 30px;
    gap: 20px;
  }
`;

export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
  }

  @media screen and (max-width: 768px) {
    -webkit-overflow-scrolling: touch;
  }
`;

export const StyledTable = styled.table`
  border: 1px solid rgba(248, 248, 248, 1);
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 100%;

  @media screen and (max-width: 1440px) {
    font-size: 14px;
  }

  @media screen and (max-width: 1024px) {
    font-size: 13px;
  }

  @media screen and (max-width: 768px) {
    font-size: 13px;
  }

  @media screen and (max-width: 480px) {
    font-size: 12px;
  }
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid #eee;

  &:nth-child(even) {
    background-color: #f7f7f7;
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const TableHeader = styled.th`
  width: 30%;
  text-align: left;
  font-weight: 500;
  color: #333;
  padding: 16px 20px;
  vertical-align: top;

  @media screen and (max-width: 1440px) {
    padding: 14px 18px;
  }

  @media screen and (max-width: 1024px) {
    padding: 12px 16px;
    width: 35%;
  }

  @media screen and (max-width: 768px) {
    padding: 10px 12px;
    width: 40%;
  }

  @media screen and (max-width: 480px) {
    padding: 8px 10px;
    width: 40%;
    font-size: 11px;
  }
`;

export const TableData = styled.td`
  width: 70%;
  text-align: right;
  color: #777;
  line-height: 1.6;
  padding: 16px 20px;
  vertical-align: top;

  @media screen and (max-width: 1440px) {
    padding: 14px 18px;
    line-height: 1.5;
  }

  @media screen and (max-width: 1024px) {
    padding: 12px 16px;
    width: 65%;
  }

  @media screen and (max-width: 768px) {
    padding: 10px 12px;
    width: 60%;
    text-align: left;
  }

  @media screen and (max-width: 480px) {
    padding: 8px 10px;
    width: 60%;
    font-size: 11px;
    text-align: left;
  }
`;
