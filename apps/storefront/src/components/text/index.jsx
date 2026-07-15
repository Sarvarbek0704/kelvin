import React from "react";
import {
  TextContainer,
  TextTitleContainer,
  TextTitle,
  TextParagraphContainer,
  TextParagraph,
} from "./Text.styled";

function Text() {
  return (
    <TextContainer>
      <TextTitleContainer>
        <TextTitle>Производство светильников</TextTitle>
      </TextTitleContainer>
      <TextParagraphContainer>
        <TextParagraph>
          Интернет-магазин Kelvin предлагает широкий ассортимент светильников
          для освещения вашего дома или офиса. У нас вы найдете разнообразные
          модели светильников, от современных и стильных до классических и
          элегантных. Мы предлагаем качественные и надежные светильники от
          лучших производителей, которые подарят вам комфорт и уют. <br />
          <br />
          Покупая светильники в нашем интернет-магазине, вы получаете отличное
          соотношение цены и качества. Мы осуществляем доставку по всей России,
          чтобы каждый клиент мог насладиться прекрасным светом и удобством
          покупки онлайн. Обратитесь к нам сегодня и превратите ваш дом в оазис
          тепла и света с Kelvin!
        </TextParagraph>
      </TextParagraphContainer>
    </TextContainer>
  );
}

export default Text;
