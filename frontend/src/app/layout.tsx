import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Nunito_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Nzila — Bilhetes Interprovinciais Online em Angola',
  description:
    'Reserve a sua passagem de autocarro entre províncias de Angola online em poucos minutos. Bilhete digital com QR Code.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={nunitoSans.variable}>
      <head></head>
      <body className={nunitoSans.className}>
        {children}
        <Toaster position="bottom-right" richColors closeButton />

        {/*
        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fnzila2809back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.19" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" />
        */}
      </body>
    </html>
  );
}
