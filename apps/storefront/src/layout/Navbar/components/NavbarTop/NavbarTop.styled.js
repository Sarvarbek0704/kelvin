import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { textColors } from "../../../../theme";

export const NavTopWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media screen and (max-width: 900px) {
    display: none;
  }
`;

export const NavTopSide = styled.div`
  display: flex;
  gap: 27px;

  @media screen and (max-width: 1100px) {
    gap: 15px;
  }
`;

export const CustomNavLink = styled(NavLink)`
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: ${textColors.secondary};
  white-space: nowrap;
`;

export const OrderPhoneButton = styled.button`
  background-color: transparent;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: ${textColors.secondary};
  white-space: nowrap;
`;

export const PhoneLink = styled.a`
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: ${textColors.primary};
  white-space: nowrap;
`;
