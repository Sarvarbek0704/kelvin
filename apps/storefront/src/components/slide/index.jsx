import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Mousewheel } from "swiper/modules";
import slideImage from "../../assets/slideImage.png";
import {
  SlideContainer,
  SlideContent,
  ImageContainer,
  SlideImage,
  SlideIcon,
  TextsContainer,
  MainText,
  Fevral,
} from "./Slide.styled";

import "swiper/css";
import "swiper/css/pagination";

function Slide() {
  const slides = Array.from({ length: 8 }).map((_, index) => ({
    id: index + 1,
    title: "Скидка 15%\nна все подвесные\nсветильники",
    date: "до 5 февраля",
    image: slideImage,
  }));

  return (
    <SlideContainer>
      <Swiper
        modules={[Pagination, Mousewheel]}
        mousewheel={{
          forceToAxis: true,
          sensitivity: 0.3,
          thresholdDelta: 50,
          thresholdTime: 300,
          releaseOnEdges: true,
        }}
        pagination={{
          clickable: true,
          el: ".custom-pagination",
          renderBullet: function (index, className) {
            return `<span class="${className} custom-bullet"></span>`;
          },
        }}
        className="mySwiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <SlideContent>
              <ImageContainer>
                <SlideImage src={slide.image} alt="slide image" />
              </ImageContainer>
              <TextsContainer>
                <MainText>{slide.title}</MainText>
                <Fevral>{slide.date}</Fevral>
              </TextsContainer>
            </SlideContent>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="custom-pagination-container">
        <div className="custom-pagination"></div>
      </div>
    </SlideContainer>
  );
}

export default Slide;
