import React from "react";
import catalogIcon from "../../assets/catalog-icon.png";
import { DostavkaIcon, MedalIcon, TangaIcon, YuklarIcon } from "../icons";
import {
  ReasonsContainer,
  ReasonsHeader,
  ReasonsTitle,
  AboutButton,
  CardsContainer,
  Card,
  IconWrapper,
  CardText,
  CardTitle,
  CardDescription,
} from "./Reason.styled";
import { Link } from "react-router-dom";

function Reasons() {
  const reasonsData = [
    {
      icon: <MedalIcon />,
      title: "Только проверенные бренды",
      description: "Бренды, проверенные временем и качеством",
    },
    {
      icon: <TangaIcon />,
      title: "Самые низкие цены",
      description: "Ниже не будет нигде",
    },
    {
      icon: <DostavkaIcon />,
      title: "Быстрая доставка",
      description: "Доставляем по всей РФ за 1-10 дней",
    },
    {
      icon: <YuklarIcon />,
      title: "Большой ассортимент",
      description: "Более 1000 товаров",
    },
  ];

  return (
    <ReasonsContainer>
      <ReasonsHeader>
        <ReasonsTitle>Почему Kelvin?</ReasonsTitle>
        <Link to="/about-us" className="link">
          <AboutButton>
            О компании <img src={catalogIcon} alt="catalogIcon" />
          </AboutButton>
        </Link>
      </ReasonsHeader>
      <CardsContainer>
        {reasonsData.map((reason, index) => (
          <Card key={index}>
            <IconWrapper>{reason.icon}</IconWrapper>
            <CardText>
              <CardTitle>{reason.title}</CardTitle>
              <CardDescription>{reason.description}</CardDescription>
            </CardText>
          </Card>
        ))}
      </CardsContainer>
    </ReasonsContainer>
  );
}

export default Reasons;
