import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RootLayout from './layout/RootLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import ProductPage from './pages/ProductPage';
import Products from './pages/AllProducts';
import Basket from './pages/Basket';
import AboutUs from './pages/AboutUs';
import DeliveryPayment from './pages/DeliveryPayment';
import Return from './pages/Return';
import Garant from './pages/Garant';
import Contacts from './pages/Contacts';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Favorites from './pages/Favorites';
import NotFoundPage from './pages/NotFoundPage';
import Catalog from './pages/Catalog';
import Account from './pages/Account';
import Auth from './pages/Auth';
import Orders from './pages/Orders';

function App() {
  return (
    <Routes>
      {/* Auth — sayt chrome'siz alohida to'liq ekran (RootLayout TASHQARISIDA) */}
      <Route path="/auth" element={<Auth />} />

      {/* ⚠️ Navbar/Footer RootLayout'da BIR MARTA render qilinadi (docs 13 §3.3).
          Barcha sahifalar Outlet ostida — navigatsiyada chrome qayta mount bo'lmaydi. */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/basket" element={<Basket />} />
        <Route path="/all-products" element={<Products />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/delivery-payment" element={<DeliveryPayment />} />
        <Route path="/return" element={<Return />} />
        <Route path="/garant" element={<Garant />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/account" element={<Account />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
