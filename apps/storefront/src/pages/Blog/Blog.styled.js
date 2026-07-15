import styled from "styled-components";

export const BlogContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin: 40px 200px;
  padding: 40px 0;

  .BreadCrumb {
    display: flex;
    gap: 10px;
  }
  @media screen and (max-width: 1024px) {
    margin: 40px 100px;
    padding: 30px 0;
  }

  @media screen and (max-width: 768px) {
    margin: 30px 50px;
    padding: 25px 0;
  }

  @media screen and (max-width: 480px) {
    margin: 25px 20px;
    padding: 20px 0;
  }

  @media screen and (max-width: 375px) {
    margin: 20px 15px;
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

export const BlogHeader = styled.div`
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

export const BlogTitle = styled.h1`
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

export const BlogButton = styled.button`
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
    align-self: flex-end;
    padding: 12px 30px;
  }

  @media screen and (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 12px;
    margin-top: 10px;
  }
`;

export const BlogContent = styled.div`
  display: flex;
  gap: 25px;
  justify-content: space-between;

  @media screen and (max-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto auto;
    gap: 20px;
  }

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, auto);
    gap: 25px;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media screen and (min-width: 1440px) {
    gap: 30px;
  }
`;

export const BlogCard = styled.div`
  color: rgba(69, 69, 69, 1);
  justify-content: space-between;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 400px;
  border-bottom: 1px solid rgba(69, 69, 69, 0.2);
  padding: 10px;
  padding-bottom: 25px;

  @media screen and (max-width: 1024px) {
    width: 100%;
  }

  @media screen and (max-width: 768px) {
    padding: 0 0 20px 0;
    gap: 12px;
  }

  @media screen and (min-width: 1440px) {
    width: 450px;
  }

  @media screen and (max-width: 1024px) {
    &:nth-child(3) {
      grid-column: span 2;
      max-width: calc(50% - 10px);
      justify-self: center;
    }
  }

  @media screen and (max-width: 768px) {
    &:nth-child(3) {
      grid-column: span 1;
      max-width: 100%;
    }
  }
`;

export const BlogImage = styled.img`
  border-radius: 10px;
  width: 100%;
  height: 270px;
  object-fit: cover;

  @media screen and (max-width: 1024px) {
    height: 220px;
  }

  @media screen and (max-width: 768px) {
    height: 250px;
  }

  @media screen and (max-width: 480px) {
    height: 200px;
    border-radius: 8px;
  }

  @media screen and (max-width: 375px) {
    height: 180px;
  }

  @media screen and (min-width: 1440px) {
    height: 300px;
  }
`;

export const BlogCardCenter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding-right: 10px;

  @media screen and (max-width: 480px) {
    gap: 15px;
    padding-right: 0;
  }
`;

export const BlogCardTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  flex: 1;

  @media screen and (max-width: 1024px) {
    font-size: 18px;
  }

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: 16px;
  }

  @media screen and (max-width: 375px) {
    font-size: 15px;
  }
`;

export const BlogCardDate = styled.p`
  font-size: 14px;
  color: rgba(69, 69, 69, 1);
  margin: 0;

  @media screen and (max-width: 480px) {
    font-size: 12px;
  }
`;

export const ArrowIcon = styled.div`
  flex-shrink: 0;

  @media screen and (max-width: 375px) {
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;
