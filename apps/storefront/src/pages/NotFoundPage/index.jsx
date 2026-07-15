import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";
import {
  NotFoundWrapper,
  ContentWrapper,
  NotFoundTitle,
  NotFoundMessage,
  HomeButton,
  ErrorNumber,
  ErrorContainer,
} from "./NotFoundPage.styled";

function NotFoundPage() {
  return (
    <div>
      <Navbar />
      <NotFoundWrapper>
        <ContentWrapper>
          <ErrorContainer>
            <ErrorNumber>404</ErrorNumber>
            <NotFoundTitle>Похоже, ничего не нашлось :(</NotFoundTitle>
            <Link to="/" style={{ textDecoration: "none" }}>
              <HomeButton>На главную</HomeButton>
            </Link>
          </ErrorContainer>
        </ContentWrapper>
      </NotFoundWrapper>
    </div>
  );
}

export default NotFoundPage;
