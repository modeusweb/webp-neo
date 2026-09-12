import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const siteUrl = 'https://webp-neo.vercel.app/';

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'WebP Neo',
  url: siteUrl,
  description:
    'Free, private image converter. Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP directly in your browser.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  inLanguage: 'en',
  isAccessibleForFree: true,
  sameAs: 'https://github.com/modeusweb/webp-neo',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Batch conversion',
    'PNG to WebP',
    'JPG to WebP',
    'BMP to WebP',
    'GIF to WebP',
    'AVIF to WebP',
    'TIFF to WebP',
    'Adjustable quality',
    'Resize images',
    'ZIP download',
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is WebP Neo really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, WebP Neo is 100% free. There is no sign-up, no watermark and no usage limit — all processing happens locally in your browser.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is converting images with WebP Neo private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Every image is processed locally in your browser and is never uploaded — your files never leave your device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which image formats can I convert to WebP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'WebP Neo supports PNG, JPG, BMP, GIF, AVIF and TIFF files, and converts all of them to WebP.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I convert multiple images at once?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can batch-convert up to 30 files at a time (50 MB per file, 200 MB total) and download the results as a ZIP archive.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I use WebP instead of PNG or JPG?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'WebP files are typically 25-35% smaller than PNG or JPG at the same visual quality, which makes pages load faster and saves bandwidth.',
      },
    },
  ],
};

export const metadata: Metadata = {
  title: 'WebP Neo — Free Image to WebP Converter (Private & Secure)',
  description:
    'Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP instantly. 100% free, private, and secure — all processing happens in your browser. No uploads, no sign-up, no limits.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'WebP Neo',
    title: 'WebP Neo — Free Image to WebP Converter',
    description:
      'Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP instantly. 100% free and private — all processing happens in your browser.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WebP Neo — free image to WebP converter interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebP Neo — Free Image to WebP Converter',
    description:
      'Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP instantly. 100% free and private — all processing happens in your browser.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </body>
    </html>
  );
}