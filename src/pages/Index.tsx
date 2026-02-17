import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">🏆 FinBridge</h1>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <Dashboard />;
};

export default Index;
