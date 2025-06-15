import { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Notion Spark Studio',
  description: 'Faça login para acessar sua conta',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Notion Spark Studio</h1>
          <p className="mt-2 text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
} 