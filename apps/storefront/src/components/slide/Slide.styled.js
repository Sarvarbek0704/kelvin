import styled from "styled-components";

export const SlideContainer = styled.div`
  position: relative;
  background-color: rgba(242, 242, 242, 1);
  border-radius: 30px;
  margin: 20px 15px;
  overflow: hidden;
  padding-bottom: 50px;

  .swiper {
    width: 100%;
    height: 100%;
  }

  .swiper-slide {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .custom-pagination-container {
    position: absolute;
    bottom: 40px;
    right: 50px;
    width: auto;
    display: flex;
    justify-content: flex-end;
    z-index: 10;
  }

  .custom-pagination {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    border-radius: 20px;
  }

  .swiper-pagination-bullet {
    border-radius: 50%;
    width: 8px;
    height: 8px;
    background-color: rgba(69, 69, 69, 0.3);
    opacity: 1;
    margin: 0 !important;
  }

  .swiper-pagination-bullet-active {
    background-color: rgba(69, 69, 69, 0.8);
    border-radius: 50%;
  }

  .swiper-button-next,
  .swiper-button-prev {
    display: none !important;
  }

  @media screen and (max-width: 375px) {
    margin: 15px 10px;
    border-radius: 25px;
    padding-bottom: 40px;

    .custom-pagination-container {
      bottom: 15px;
      right: 15px;
    }

    .swiper-pagination-bullet {
      width: 6px;
      height: 6px;
    }

    .swiper-pagination-bullet-active {
      width: 66px;
      height: 6px;
    }
  }

  @media screen and (min-width: 376px) and (max-width: 425px) {
    margin: 18px 12px;
  }

  @media screen and (min-width: 426px) and (max-width: 767px) {
    margin: 25px 20px;
    border-radius: 35px;

    .custom-pagination-container {
      bottom: 25px;
      right: 25px;
    }
  }

  @media screen and (min-width: 768px) {
    border-radius: 50px;
    margin: 30px 100px;
    padding-bottom: 60px;

    .custom-pagination-container {
      bottom: 30px;
      right: 50px;
    }

    .swiper-pagination-bullet {
      width: 10px;
      height: 10px;
    }

    .swiper-pagination-bullet-active {
      width: 15px;
      height: 15px;
    }

    .custom-pagination {
      gap: 10px;
      padding: 8px 15px;
    }
  }
`;

export const SlideContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  gap: 20px;
  width: 100%;

  @media screen and (max-width: 375px) {
    padding: 20px 15px;
    gap: 15px;
  }

  @media screen and (min-width: 376px) and (max-width: 425px) {
    padding: 25px 18px;
  }

  @media screen and (min-width: 426px) and (max-width: 767px) {
    padding: 35px 25px;
    gap: 25px;
  }

  @media screen and (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    padding: 0 150px;
    gap: 200px;
  }
`;

export const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  order: 1;

  @media screen and (min-width: 768px) {
    order: 2;
    width: auto;
  }
`;

export const SlideImage = styled.img`
  width: 100%;
  max-width: 250px;
  height: auto;
  object-fit: contain;

  @media screen and (max-width: 375px) {
    max-width: 200px;
  }

  @media screen and (min-width: 376px) and (max-width: 425px) {
    max-width: 220px;
  }

  @media screen and (min-width: 426px) and (max-width: 767px) {
    max-width: 250px;
  }

  @media screen and (min-width: 768px) {
    max-width: 450px;
  }
`;

export const SlideIcon = styled.img`
  position: absolute;
  bottom: -10px;
  right: 20px;
  width: 70px !important;
  height: auto;

  @media screen and (max-width: 375px) {
    width: 60px !important;
    bottom: -8px;
    right: 15px;
  }

  @media screen and (min-width: 426px) and (max-width: 767px) {
    width: 75px !important;
    bottom: -12px;
    right: 25px;
  }

  @media screen and (min-width: 768px) {
    top: 330px;
    right: 40px;
    bottom: auto;
    width: 108px !important;
  }
`;

export const TextsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(69, 69, 69, 1);
  width: 100%;
  order: 2;
  text-align: center;
  padding: 10px 0;

  @media screen and (min-width: 768px) {
    order: 1;
    text-align: left;
    align-items: flex-start;
    padding: 50px 0;
    width: 600px;
  }
`;

export const MainText = styled.h1`
  font-size: 22px;
  line-height: 1.3;
  font-weight: 600;
  margin-bottom: 15px;
  width: 100%;
  white-space: pre-line;

  @media screen and (max-width: 375px) {
    font-size: 20px;
  }

  @media screen and (min-width: 376px) and (max-width: 425px) {
    font-size: 24px;
  }

  @media screen and (min-width: 426px) and (max-width: 767px) {
    font-size: 26px;
    margin-bottom: 20px;
  }

  @media screen and (min-width: 768px) {
    font-size: 50px;
    line-height: 1.2;
    margin-bottom: 20px;
  }
`;

export const Fevral = styled.p`
  color: rgba(255, 255, 255, 1);
  background-color: rgba(69, 69, 69, 1);
  border-radius: 100px;
  font-size: 18px;
  padding: 8px 25px;
  display: inline-block;
  font-weight: 600;

  @media screen and (max-width: 375px) {
    font-size: 16px;
    padding: 6px 20px;
  }

  @media screen and (min-width: 376px) and (max-width: 425px) {
    font-size: 19px;
  }

  @media screen and (min-width: 426px) and (max-width: 767px) {
    font-size: 20px;
    padding: 10px 30px;
  }

  @media screen and (min-width: 768px) {
    align-self: flex-start;
    font-size: 40px;
    padding: 10px 40px;
  }
`;
