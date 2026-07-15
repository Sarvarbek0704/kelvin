import React from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Products from "./pages/AllProducts";
import ProductDetail from "./pages/ProductDetail";
import Basket from "./pages/Basket";
import AboutUs from "./pages/AboutUs";
import DeliveryPayment from "./pages/DeliveryPayment";
import Return from "./pages/Return";
import Garant from "./pages/Garant";
import Contacts from "./pages/Contacts";
import Blog from "./pages/Blog";
import Favorites from "./pages/Favorites";
import NotFoundPage from "./pages/NotFoundPage";
import Catalog from "./pages/Catalog";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout></MainLayout>} />
      <Route path="/basket" element={<Basket></Basket>} />
      <Route path="/all-products" element={<Products></Products>} />
      <Route path="/product-detail" element={<ProductDetail></ProductDetail>} />
      <Route path="/about-us" element={<AboutUs></AboutUs>} />
      <Route
        path="/delivery-payment"
        element={<DeliveryPayment></DeliveryPayment>}
      />
      <Route path="/return" element={<Return></Return>} />
      <Route path="/garant" element={<Garant></Garant>} />
      <Route path="/contacts" element={<Contacts></Contacts>} />
      <Route path="/blog" element={<Blog></Blog>} />
      <Route path="/favorites" element={<Favorites></Favorites>} />
      <Route path="/catalog" element={<Catalog></Catalog>} />
      <Route path="*" element={<NotFoundPage></NotFoundPage>} />
    </Routes>
  );
}

export default App;
