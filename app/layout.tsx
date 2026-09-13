import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Caveat } from 'next/font/google';
import './globals.css';
import { VisitorLetter } from '@/components/portfolio/visitor-letter';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Данила Плешаков',
  description: 'Данила Плешаков — дизайнер продукта. Люблю прорабатывать взаимодействие с интерфейсом. Считаю, что дизайн — magic.',
  icons: { icon: '/favicon.svg' },
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
        <VisitorLetter />
      </body>
    </html>
  );
}
