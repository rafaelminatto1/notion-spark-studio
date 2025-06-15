import { Metadata } from 'next';
import { AuthGuard } from '@/components/AuthGuard';
import { Dashboard } from '@/components/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Notion Spark Studio',
  description: 'Seu dashboard de produtividade',
};

export default function HomePage() {
  return (
    <AuthGuard>
      <main className="flex min-h-screen flex-col">
        <Dashboard />
      </main>
    </AuthGuard>
  );
} 