import React, { useState } from "react";
import lyustra from "../../assets/lyustra.png";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import {
  HeartIcon,
  OkIcon,
  Phone2Icon,
  PhoneIcon,
  TelegramIcon,
  WkIcon,
} from "../../components";

import {
  ProductDetailWrapper,
  BreadcrumbLink,
  DetailCard,
  ImageGallery,
  MainImage,
  ThumbnailContainer,
  Thumbnail,
  DataContainer,
  Title,
  DataCenter,
  IconsContainer,
  IconsRow,
  InStockText,
  PriceContainer,
  CurrentPrice,
  OldPrice,
  InfoText,
  DetailFooter,
  Counter,
  AddToCartButton,
  HeartIconWrapper,
  MainContent,
  TableContainer,
  StyledTable,
  TableRow,
  TableHeader,
  TableData,
} from "./ProductDetail.styled";

const ProductDetail = () => {
  const [selectedImage, setSelectedImage] = useState(lyustra);

  const productImages = [lyustra, lyustra, lyustra, lyustra];

  return (
    <div>
      <Navbar />
      <ProductDetailWrapper>
        <BreadcrumbLink href="/">Главная {">"}</BreadcrumbLink>
        <DetailCard>
          <ImageGallery>
            <MainImage src={selectedImage} alt="product image" />
            <ThumbnailContainer>
              {productImages.map((image, index) => (
                <Thumbnail
                  key={index}
                  src={image}
                  alt={`product thumbnail ${index + 1}`}
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </ThumbnailContainer>
          </ImageGallery>

          <DataContainer>
            <Title>
              <h1>Встраиваемый светильник Novotech</h1>
            </Title>

            <DataCenter>
              <p>Scott</p>

              <IconsContainer>
                <p>Артикул : 7655-188</p>
                <IconsRow>
                  <OkIcon />
                  <WkIcon />
                  <TelegramIcon />
                  <PhoneIcon />
                  <Phone2Icon />
                </IconsRow>
              </IconsContainer>

              <InStockText>В наличии</InStockText>
            </DataCenter>

            <PriceContainer>
              <CurrentPrice>435 000  so'm</CurrentPrice>
              <OldPrice>522 000  so'm</OldPrice>
            </PriceContainer>

            <InfoText>
              <p>
                Профессиональный гоночный хардтейл для кросс-кантри уровня
                Чемпионата и Кубка Мира. Одна из самых легких рам среди гоночных
                хардтейлов для кросс-кантри.
              </p>
            </InfoText>

            <DetailFooter>
              <Counter>
                <p>- 1 +</p>
              </Counter>
              <AddToCartButton>В корзину</AddToCartButton>
              <HeartIconWrapper>
                <HeartIcon />
              </HeartIconWrapper>
            </DetailFooter>
          </DataContainer>
        </DetailCard>

        <MainContent>
          <h1>Характеристика</h1>
          <TableContainer>
            <StyledTable>
              <tbody>
                <TableRow>
                  <TableHeader>Цвет</TableHeader>
                  <TableData>Жёлтый</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Год</TableHeader>
                  <TableData>2016</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Диаметр колеса</TableHeader>
                  <TableData>27.5</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Материал рамы</TableHeader>
                  <TableData>Карбон</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Размер</TableHeader>
                  <TableData>L</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Страна</TableHeader>
                  <TableData>Швейцария</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Производитель</TableHeader>
                  <TableData>Scott</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Покрышки</TableHeader>
                  <TableData>
                    Schwalbe Rocket Ron EVO / 2.1 127EPI Kevlar Bead Tubeless
                    Easy / PaceStar compound
                  </TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Рама</TableHeader>
                  <TableData>
                    Scale Carbon / HMX-технология / технология IMP / Коническая
                    рулевая труба / BB92 / Технология SDS / Дропауты IDS SL
                  </TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Подседельный Штырь</TableHeader>
                  <TableData>
                    Ritchey WCS 700 Series: Carbon Link FlexLogic / 31.6mm 900
                    Series: Carbon 2B SDS / 34.9mm
                  </TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Седло</TableHeader>
                  <TableData>Ritchey WCS Streem V3 Titanium rails</TableData>
                </TableRow>
                <TableRow>
                  <TableHeader>Вилка</TableHeader>
                  <TableData>
                    Rock Shox SID RL3 Air / демпфер DNA3 3-режима / 15mm QR axle
                    / коническая рулевая труба / Удалённая блокировка,
                    регулировка отскока / ход 100mm
                  </TableData>
                </TableRow>
              </tbody>
            </StyledTable>
          </TableContainer>
        </MainContent>
      </ProductDetailWrapper>
      <Footer />
    </div>
  );
};

export default ProductDetail;
