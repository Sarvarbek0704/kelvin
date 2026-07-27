import { type ReactNode, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { AppLayout } from '@/layout/AppLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { CategoriesPage } from '@/pages/Categories';
import { AttributesPage } from '@/pages/Attributes';
import { ProductsPage } from '@/pages/Products';
import { ProductDetailPage } from '@/pages/ProductDetail';
import { OrdersPage } from '@/pages/Orders';
import { OrderDetailPage } from '@/pages/OrderDetail';
import { InventoryPage } from '@/pages/Inventory';
import { ProcurementPage } from '@/pages/Procurement';
import { ContentPage } from '@/pages/Content';
import { LeadsPage } from '@/pages/Leads';
import { ReviewsPage } from '@/pages/Reviews';
import { InstallmentsPage } from '@/pages/Installments';
import { PosPage } from '@/pages/Pos';
import { AnalyticsPage } from '@/pages/Analytics';

function RequireAuth({ children }: { children: ReactNode }): ReactNode {
  const token = useAuth((s) => s.accessToken);
  return token !== null ? children : <Navigate to="/login" replace />;
}

export function App(): ReactNode {
  const bootstrapped = useAuth((s) => s.bootstrapped);
  const setBootstrapped = useAuth((s) => s.setBootstrapped);

  // Ilova yuklanganda: refresh cookie'dan sessiyani tiklashga urinamiz.
  useEffect(() => {
    if (bootstrapped) {
      return;
    }
    void api.refresh().finally(() => setBootstrapped());
  }, [bootstrapped, setBootstrapped]);

  if (!bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">Yuklanmoqda…</div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="installments" element={<InstallmentsPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="attributes" element={<AttributesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
