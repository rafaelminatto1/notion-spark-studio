import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

export const metadata = {
  title: 'Notion Spark Studio',
  description: 'Sua plataforma de produtividade inteligente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 