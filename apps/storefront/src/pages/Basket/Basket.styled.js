import styled from "styled-components";

export const BasketPage = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: white;
`;

export const BasketContainer = styled.div`
  flex: 1;
  margin: 40px 200px;
  padding: 40px 0;

  h1 {
    color: rgba(69, 69, 69, 1);
    font-size: 40px;
    font-weight: 700;
    margin-bottom: 40px;
  }

  .uvo {
    position: relative;

    .uvo-2 {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 15px;
      height: 16px;
      font-size: 10px;
      padding: 5px;
      border-radius: 100%;
      color: white;
      background-color: rgba(198, 60, 60, 1);
      top: 5px;
      left: 160px;
      position: absolute;
    }
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
    padding: 15px 0;
  }
`;

export const TableContainer = styled.div`
  background-color: rgba(242, 242, 242, 1);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 40px;
  border: 1px solid rgba(217, 217, 217, 1);

  @media screen and (min-width: 769px) {
    display: block;
  }

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 1.2fr 2fr 1.5fr 1fr 0.5fr;
  background-color: rgba(242, 242, 242, 1);
  padding: 20px;
  font-weight: 500;
  color: rgba(69, 69, 69, 1);
  opacity: 50%;
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid rgba(69, 69, 69, 0.3);
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 1.2fr 2fr 1.5fr 1fr 0.5fr;
  padding: 20px;
  border-bottom: 1px solid rgba(217, 217, 217, 1);
  align-items: center;
  background-color: rgba(242, 242, 242, 1);

  &:last-child {
    border-bottom: none;
  }
`;

export const ColumnPhoto = styled.div`
  display: flex;
  justify-content: center;
`;

export const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  background: #f5f5f5;
`;

export const ColumnProduct = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 10px;
`;

export const ProductName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: rgba(69, 69, 69, 1);
  margin-bottom: 5px;
  line-height: 1.3;
`;

export const ProductPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
  margin-top: 5px;
`;

export const ColumnDescription = styled.div`
  font-size: 14px;
  color: rgba(69, 69, 69, 1);
  line-height: 1.4;
  padding: 0 10px;
`;

export const ColumnArticle = styled.div`
  font-size: 13px;
  color: rgba(159, 159, 159, 1);
  line-height: 1.4;
  padding: 0 10px;
  font-weight: 500;
  text-align: center;
`;

export const ColumnQuantity = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(242, 242, 242, 1);
  border-radius: 100px;
  padding: 5px 15px;
`;

export const QuantityButton = styled.button`
  width: 25px;
  height: 25px;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

export const QuantityValue = styled.span`
  border-radius: 10px;
  padding: 14px 20px;
  border: 1px solid rgba(69, 69, 69, 0.2);
  min-width: 20px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  color: rgba(69, 69, 69, 1);
`;

export const ColumnDelete = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const DeleteButton = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid rgba(217, 217, 217, 1);
  background: white;
  border-radius: 50%;
  font-size: 18px;
  color: rgba(159, 159, 159, 1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MobileBasketItem = styled.div`
  @media screen and (min-width: 769px) {
    display: none;
  }

  @media screen and (max-width: 768px) {
    display: block;
    background-color: rgba(242, 242, 242, 1);
    border-radius: 15px;
    border: 1px solid rgba(217, 217, 217, 1);
    margin-bottom: 20px;
    padding: 20px;
  }
`;

export const MobileItemHeader = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
`;

export const MobileItemImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
`;

export const MobileItemInfo = styled.div`
  flex: 1;
`;

export const MobileItemName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: rgba(69, 69, 69, 1);
  margin-bottom: 5px;
  line-height: 1.3;
`;

export const MobileItemPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
`;

export const MobileItemDescription = styled.div`
  font-size: 14px;
  color: rgba(69, 69, 69, 1);
  line-height: 1.4;
  margin-bottom: 15px;
`;

export const MobileItemArticle = styled.div`
  font-size: 12px;
  color: rgba(159, 159, 159, 1);
  margin-bottom: 15px;
  font-weight: 500;
`;

export const MobileItemActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
`;

export const MobileQuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 100px;
  padding: 5px 15px;
`;

export const MobileDeleteButton = styled.button`
  padding: 8px 16px;
  border: 1px solid rgba(217, 217, 217, 1);
  background: white;
  border-radius: 100px;
  font-size: 14px;
  color: rgba(159, 159, 159, 1);
`;

export const OrderFormContainer = styled.div`
  background-color: rgba(242, 242, 242, 1);
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid rgba(217, 217, 217, 1);
`;

export const OrderFormHeader = styled.h3`
  background-color: rgba(242, 242, 242, 1);
  padding: 20px;
  font-size: 24px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
  margin: 0;
`;

export const FormContent = styled.div`
  padding: 30px;
`;

export const PersonalInfoForm = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

export const FormGroup = styled.div`
  width: 100%;

  .oltmish {
    width: 60% !important;
  }
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 12px 20px;
  border: 1px solid rgba(69, 69, 69, 1);
  border-radius: 100px;
  font-size: 14px;
  outline: none;
  background: none;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(69, 69, 69, 1);
  }
`;

export const DeliveryForm = styled.div`
  border-top: 1px solid rgba(217, 217, 217, 1);
  padding-top: 30px;
`;

export const DeliveryTitle = styled.h4`
  font-size: 20px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
  margin: 0 0 20px 0;
`;

export const FormTextarea = styled.textarea`
  margin-top: 25px;
  width: 60%;
  padding: 15px 20px;
  border: 1px solid rgba(69, 69, 69, 1);
  border-radius: 15px;
  font-size: 14px;
  outline: none;
  background: none;
  box-sizing: border-box;
  min-height: 100px;
  resize: vertical;

  &::placeholder {
    color: rgba(69, 69, 69, 1);
  }
`;

export const PaymentSummary = styled.div`
  background-color: rgba(242, 242, 242, 1);
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid rgba(217, 217, 217, 1);
  margin-top: 40px;
  padding: 30px;

  .flex-2 {
    display: flex;
    align-items: center;
    gap: 30px;

    @media (max-width: 580px) {
      flex-direction: column;
    }
  }
`;

export const PaymentTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: rgba(69, 69, 69, 1);
  margin: 0 0 25px 0;
  padding-bottom: 10px;
`;

export const PaymentDetails = styled.div`
  margin-bottom: 25px;
  .flex {
    display: flex;
    gap: 25px;
    opacity: 50%;
  }
`;

export const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 16px;
  color: rgba(69, 69, 69, 1);

  &.total {
    font-size: 20px;
    font-weight: 700;
    margin-top: 20px;
    padding-top: 20px;
  }
`;

export const BuyButton = styled.button`
  width: 30%;
  padding: 16px;
  background-color: rgba(69, 69, 69, 1);
  color: white;
  border: none;
  border-radius: 100px;
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0;

  @media (max-width: 580px) {
    width: 100%;
  }
`;

export const PrivacyCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CheckboxInput = styled.input.attrs({ type: "checkbox" })`
  appearance: none;

  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(69, 69, 69, 1);
  background: white;
  position: relative;

  &:checked::after {
    content: "✓";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
    color: rgba(69, 69, 69, 1);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
  }

  @media (max-width: 768px) {
    width: 18px;
    height: 18px;

    &:checked::after {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    width: 16px;
    height: 16px;

    &:checked::after {
      font-size: 11px;
    }
  }
`;

export const CheckboxLabel = styled.label`
  font-size: 14px;
  opacity: 50%;
  color: rgba(69, 69, 69, 1);

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;
