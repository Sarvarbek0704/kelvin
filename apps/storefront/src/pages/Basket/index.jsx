import React from "react";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import lyustra from "../../assets/lyustra.png";
import {
  BasketPage,
  BasketContainer,
  TableContainer,
  TableHeader,
  TableRow,
  ColumnPhoto,
  ProductImage,
  ColumnProduct,
  ProductName,
  ProductPrice,
  ColumnDescription,
  ColumnArticle,
  ColumnQuantity,
  QuantityControl,
  QuantityButton,
  QuantityValue,
  ColumnDelete,
  DeleteButton,
  OrderFormContainer,
  OrderFormHeader,
  FormContent,
  PersonalInfoForm,
  FormGroup,
  FormInput,
  DeliveryForm,
  DeliveryTitle,
  FormTextarea,
  PaymentSummary,
  PaymentTitle,
  PaymentDetails,
  PaymentRow,
  BuyButton,
  PrivacyCheckbox,
  CheckboxInput,
  CheckboxLabel,
  MobileBasketItem,
  MobileItemHeader,
  MobileItemImage,
  MobileItemInfo,
  MobileItemName,
  MobileItemPrice,
  MobileItemDescription,
  MobileItemArticle,
  MobileItemActions,
  MobileQuantityControl,
  MobileDeleteButton,
} from "./Basket.styled";
import { DeleteIcon } from "../../components";

function Basket() {
  const basketItems = [
    {
      id: 1,
      name: "Встраиваемый светильник Novotech",
      price: "6 399  so'm",
      description:
        "Светильник RADUGA COMBO XS Промышленное освещение; 50Вт; 230В; S4; XS;",
      article: "RAD-COMBO-50/XXX/230/XXX/XXX/S4/XS",
      quantity: 1,
      image: lyustra,
    },
    {
      id: 2,
      name: "Встраиваемый светильник Novotech",
      price: "6 399  so'm",
      description:
        "Светильник RADUGA COMBO XS Промышленное освещение; 50Вт; 230В; S4; XS;\n50Br; 230B; S4; XS;",
      article: "RAD-COMBO-50/XXX/230/XXX/XXX/S4/XS",
      quantity: 1,
      image: lyustra,
    },
  ];

  return (
    <BasketPage>
      <Navbar />
      <BasketContainer>
        <div className="uvo">
          <h1>Корзина</h1>
          <div className="uvo-2">
            <span>2</span>
          </div>
        </div>

        <TableContainer>
          <TableHeader>
            <div>Фото</div>
            <div>Товары</div>
            <div>Описание</div>
            <div>Артикул</div>
            <div>Количество</div>
            <div></div>
          </TableHeader>

          {basketItems.map((item) => (
            <TableRow key={item.id}>
              <ColumnPhoto>
                <ProductImage src={item.image} alt="Светильник" />
              </ColumnPhoto>
              <ColumnProduct>
                <ProductName>{item.name}</ProductName>
                <ProductPrice>{item.price}</ProductPrice>
              </ColumnProduct>
              <ColumnDescription>
                {item.description.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < item.description.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </ColumnDescription>
              <ColumnArticle>{item.article}</ColumnArticle>
              <ColumnQuantity>
                <QuantityControl>
                  <QuantityButton>-</QuantityButton>
                  <QuantityValue>{item.quantity}</QuantityValue>
                  <QuantityButton>+</QuantityButton>
                </QuantityControl>
              </ColumnQuantity>
              <ColumnDelete>
                <DeleteIcon />
              </ColumnDelete>
            </TableRow>
          ))}
        </TableContainer>

        {basketItems.map((item) => (
          <MobileBasketItem key={`mobile-${item.id}`}>
            <MobileItemHeader>
              <MobileItemImage src={item.image} alt="Светильник" />
              <MobileItemInfo>
                <MobileItemName>{item.name}</MobileItemName>
                <MobileItemPrice>{item.price}</MobileItemPrice>
              </MobileItemInfo>
            </MobileItemHeader>
            <MobileItemDescription>
              {item.description.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < item.description.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </MobileItemDescription>
            <MobileItemArticle>{item.article}</MobileItemArticle>
            <MobileItemActions>
              <MobileQuantityControl>
                <QuantityButton>-</QuantityButton>
                <QuantityValue>{item.quantity}</QuantityValue>
                <QuantityButton>+</QuantityButton>
              </MobileQuantityControl>
              <DeleteIcon />
            </MobileItemActions>
          </MobileBasketItem>
        ))}

        <OrderFormContainer>
          <OrderFormHeader>Оформление</OrderFormHeader>
          <FormContent>
            <PersonalInfoForm>
              <FormGroup>
                <FormInput type="text" placeholder="ФИО" />
              </FormGroup>
              <FormGroup>
                <FormInput type="tel" placeholder="Телефон" />
              </FormGroup>
              <FormGroup>
                <FormInput type="email" placeholder="Электронная Почта" />
              </FormGroup>
            </PersonalInfoForm>

            <DeliveryForm>
              <DeliveryTitle>Доставка</DeliveryTitle>
              <FormGroup>
                <FormInput
                  type="text"
                  placeholder="Адрес доставки"
                  className="oltmish"
                />
              </FormGroup>
              <FormGroup>
                <FormTextarea placeholder="Комментарий"></FormTextarea>
              </FormGroup>
            </DeliveryForm>
          </FormContent>
        </OrderFormContainer>

        <PaymentSummary>
          <PaymentTitle>Оплата</PaymentTitle>
          <PaymentDetails>
            <div className="flex">
              <PaymentRow>
                <span>
                  Товары............................................. 12 300  so'm
                </span>
              </PaymentRow>
              <PaymentRow>
                <span>
                  Доставка.............................................. 580  so'm
                </span>
              </PaymentRow>
            </div>

            <PaymentRow className="total">
              <span>12 800  so'm</span>
            </PaymentRow>
          </PaymentDetails>
          <div className="flex-2">
            <BuyButton>Купить</BuyButton>

            <PrivacyCheckbox>
              <CheckboxInput id="privacy-agreement" defaultChecked />
              <CheckboxLabel htmlFor="privacy-agreement">
                Я согласен на обработку моих персональных данных
              </CheckboxLabel>
            </PrivacyCheckbox>
          </div>
        </PaymentSummary>
      </BasketContainer>

      <Footer />
    </BasketPage>
  );
}

export default Basket;
