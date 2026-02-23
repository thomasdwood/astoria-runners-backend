import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
  Repeat,
  LogOut,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/routes', label: 'Routes', icon: MapPin },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/recurring', label: 'Recurring', icon: Repeat },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r bg-muted/40 flex flex-col">
        <div className="p-4">
          <Link to="/" className="text-lg font-bold">
            Astoria Runners
          </Link>
          <p className="text-xs text-muted-foreground mt-1">{user?.displayName}</p>
        </div>
        <Separator />
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-2 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            Public Calendar
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container py-6 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
