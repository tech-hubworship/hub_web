import React from 'react';
import type { Metadata, Viewport } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: {
    default: 'HUB',
    template: '%s | HUB Worship',
  },
  description: 'HUB Worship',
  applicationName: 'HUB',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'HUB',
    capable: true,
    statusBarStyle: 'black',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-precomposed.png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return React.createElement(
    'html',
    { lang: 'ko', dir: 'ltr' },
    React.createElement(
      'body',
      null,
      React.createElement(Providers, null, children)
    )
  );
}
