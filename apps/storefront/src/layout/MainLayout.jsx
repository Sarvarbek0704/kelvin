import React from "react";
import { LayoutWrapper } from "./Layout.styled";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Slide from "../components/slide";
import Katalog from "../components/Katalog";
import Reasons from "../components/reasons";
import Products from "../components/products";
import Brands from "../components/brands/Brands";
import Blog from "../components/blog";
import Text from "../components/text";

function MainLayout() {
  return (
    <LayoutWrapper>
      <Navbar />
      <Slide />
      <Katalog />
      <Reasons />
      <Products />
      <Brands />
      <Blog />
      <Text />
      <Footer />
    </LayoutWrapper>
  );
}

export default MainLayout;
