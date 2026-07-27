import { type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  BarChart3,
  Boxes,
  CalendarClock,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Newspaper,
  UserPlus,
  Package,
  ScanBarcode,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-store';
import { logout } from '@/lib/api';
import { Button } from '@/components/ui';

const NAV = [
  { to: '/', label: 'Boshqaruv paneli', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Buyurtmalar', icon: ShoppingCart },
  { to: '/leads', label: 'Lidlar', icon: UserPlus },
  { to: '/products', label: 'Mahsulotlar', icon: Package },
  { to: '/inventory', label: 'Ombor', icon: Boxes },
  { to: '/procurement', label: 'Ta\'minot', icon: Truck },
  { to: '/installments', label: 'Rassrochka', icon: CalendarClock },
  { to: '/pos', label: 'Kassa', icon: ScanBarcode },
  { to: '/categories', label: 'Kategoriyalar', icon: FolderTree },
  { to: '/attributes', label: 'Atributlar', icon: SlidersHorizontal },
  { to: '/content', label: 'Kontent', icon: Newspaper },
  { to: '/reviews', label: 'Sharhlar', icon: Star },
  { to: '/analytics', label: 'Analitika', icon: BarChart3 },
];

export function AppLayout(): ReactNode {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const onLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5">
          <Boxes className="h-6 w-6 text-slate-900" />
          <span className="text-lg font-bold tracking-tight">Kelvin</span>
          <span className="ml-auto text-xs text-slate-400">admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 truncate text-sm text-slate-500">
            {user?.roles.join(', ') ?? '—'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => void onLogout()}
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
