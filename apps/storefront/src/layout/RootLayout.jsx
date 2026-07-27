import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutWrapper } from './Layout.styled';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Ildiz layout — Navbar va Footer BIR MARTA render qilinadi, sahifalar Outlet'da.
 *
 * ⚠️ docs/13-frontend-spec.md §3.3: eski MainLayout Outlet render QILMASDI —
 *    har sahifa o'z Navbar/Footer'ini mount qilardi va navigatsiyada savat
 *    holati yo'qolardi. Bu tuzatish shuni hal qiladi.
 */
function RootLayout() {
  return (
    <LayoutWrapper>
      <Navbar />
      <Outlet />
      <Footer />
    </LayoutWrapper>
  );
}

export default RootLayout;
