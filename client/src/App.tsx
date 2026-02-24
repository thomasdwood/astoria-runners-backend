import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { PublicLayout } from '@/components/layout/public-layout';
import { AdminLayout } from '@/components/layout/admin-layout';
import { RequireAuth } from '@/components/layout/require-auth';
import { CalendarPage } from '@/pages/calendar-page';
import { LoginPage } from '@/pages/login-page';
import { DashboardPage } from '@/pages/admin/dashboard-page';
import { RoutesPage } from '@/pages/admin/routes-page';
import { EventsPage } from '@/pages/admin/events-page';
import { RecurringPage } from '@/pages/admin/recurring-page';
import { SettingsPage } from '@/pages/admin/settings-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="recurring" element={<RecurringPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
