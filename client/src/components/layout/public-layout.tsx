import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="text-lg font-bold">
            Astoria Runners
          </Link>
          <nav>
            {user ? (
              <Link
                to="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          Astoria Runners
        </div>
      </footer>
    </div>
  );
}
