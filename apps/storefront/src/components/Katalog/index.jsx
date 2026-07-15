import React from "react";
import katalog1 from "../../assets/katalog1.png";
import katalog2 from "../../assets/katalog2.png";
import katalog3 from "../../assets/katalog3.png";
import katalog4 from "../../assets/katalog4.png";
import katalog5 from "../../assets/katalog5.png";
import katalog6 from "../../assets/katalog6.png";
import catalogIcon from "../../assets/catalog-icon.png";
import {
  KatalogContainer,
  KatalogHeader,
  KatalogSubtitle,
  KatalogMain,
  CategoriesGrid,
  CategoryCard,
  CategoryContent,
  CategoryText,
  CategoryTitle,
  CategoryLink,
  CategoryIcon,
  HammaKatalog,
} from "./Katalog.styled";
import { Link } from "react-router-dom";

function Katalog() {
  const categories = [
    {
      title: "Люстры",
      link: "От 540 000 so'm →",
      icon: katalog1,
    },
    {
      title: "Светильники",
      link: "От 540 000 so'm →",
      icon: katalog2,
    },
    {
      title: "Бра",
      link: "От 540 000 so'm →",
      icon: katalog3,
    },
    {
      title: "Торшеры",
      link: "От 540 000 so'm →",
      icon: katalog4,
    },

    {
      title: "Настольные лампы",
      link: "От 540 000 so'm →",
      icon: katalog5,
    },

    {
      title: "Споты",
      link: "От 540 000 so'm →",
      icon: katalog6,
    },
  ];

  return (
    <KatalogContainer>
      <KatalogHeader>
        <KatalogSubtitle>Каталог</KatalogSubtitle>
        <HammaKatalog>
          <Link to="/catalog" className="link">
            Весь каталог <img src={catalogIcon} alt="catalogIcon" />
          </Link>
        </HammaKatalog>
      </KatalogHeader>

      <KatalogMain>
        <CategoriesGrid>
          {categories.map((category, index) => (
            <CategoryCard key={index}>
              <CategoryContent>
                <CategoryText>
                  <CategoryTitle>{category.title}</CategoryTitle>
                  <CategoryLink href="#">{category.link}</CategoryLink>
                </CategoryText>
                <CategoryIcon>
                  <img src={category.icon} alt={category.title} />
                </CategoryIcon>
              </CategoryContent>
            </CategoryCard>
          ))}
        </CategoriesGrid>
      </KatalogMain>
    </KatalogContainer>
  );
}

export default Katalog;
