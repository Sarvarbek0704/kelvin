import styled from "styled-components";
import { bgColors, textColors } from "../../../../theme";

export const NavMainWrapper = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;

  @media screen and (max-width: 1100px) {
    gap: 20px;
  }

  @media screen and (max-width: 900px) {
    display: none;
  }

  & > img {
    height: 50px;
    object-fit: contain;
  }
`;

export const SearchWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-width: 300px;

  .link {
    text-decoration: none;
  }

  span {
    font-weight: 100;
  }

  @media screen and (max-width: 1100px) {
    .catalog-button span {
      display: none;
    }

    .catalog-button {
      padding: 14px;
      width: 50px;
      justify-content: center;
    }
  }

  .catalog-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 50px;
    padding: 14px 28px;
    border-radius: 100px;
    background-color: ${bgColors.primary};
    border: none;
    color: ${textColors.white};
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }

  .input-wrapper {
    position: relative;
    width: 100%;
    border: 1px solid ${bgColors.primary};
    border-radius: 100px;
    overflow: hidden;
    flex: 1;
  }

  & input {
    width: 100%;
    height: 50px;
    padding: 14px 48px 14px 24px;
    border-radius: 100px;
    border: none;
    outline: none;
    font-size: 16px;
    min-width: 0;
  }
  & input::placeholder {
    opacity: 40%;
  }

  .search-icon-wrap {
    position: absolute;
    right: 24px;
    top: 14px;
  }
`;

export const NavigationItems = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;

  @media screen and (max-width: 1100px) {
    gap: 20px;
  }

  .item {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    position: relative;
    overflow: visible;

    .cart-icon {
      z-index: 2;
    }
    p {
      color: white;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 50%;
      background-color: rgba(198, 60, 60, 1);
      top: -10px;
      right: 0;
      position: absolute;
      z-index: 1;
      overflow: visible;
    }

    span {
      font-weight: 600;
      font-size: 12px;
      color: rgba(69, 69, 69, 1);
      white-space: nowrap;
    }

    @media screen and (max-width: 1100px) {
      span {
        font-size: 10px;
      }
    }
  }
`;
