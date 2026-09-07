import type { Metadata } from 'next';
import { Geist, Geist_Mono, Caveat } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const signature = Caveat({
  variable: '--font-signature',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Данила Плешаков — дизайнер продукта',
  description: 'Продуктовый дизайн, понятные и удобные интерфейсы.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${signature.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
