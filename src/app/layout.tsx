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
    {
      '@type': 'Question',
      name: 'Does WebP support transparency?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. WebP supports an alpha channel, so transparent PNG graphics keep their transparency after conversion.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is WebP supported in all browsers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Chrome, Edge, Firefox, Safari and every major browser have supported WebP since 2020, so the format can be used anywhere on the web.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does WebP Neo work offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The converter runs entirely in your browser — files are never uploaded, and once the page is loaded, conversion works even without a connection.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the file size limits?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each file can be up to 50 MB, with a maximum of 30 files and 200 MB total per batch — enough for full photo shoots.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the quality slider work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The slider sets compression quality from 30% (smallest files) to 100% (best quality). Lower quality works well for photos, higher quality suits text and graphics.',
      },
    },
  ],
};

export const metadata: Metadata = {
  title: 'WebP Neo — Free Image to WebP Converter (Private & Secure)',
  description:
    'Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP — 100% free and private, all in your browser. No uploads, no sign-up, no limits.',
  keywords: [
    'webp converter',
    'convert to webp',
    'png to webp',
    'jpg to webp',
    'image converter',
    'batch image converter',
    'free image converter',
    'конвертер webp',
    'png в webp',
    'jpg в webp',
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'w_s1YAdGDmNMm19tV4F6fl_4o15nDgnZGLM8ledX-f8',
    yandex: 'e2441bdf3afdb12f',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'WebP Neo',
    title: 'WebP Neo — Free Image to WebP Converter',
    description:
      'Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP — 100% free and private, all in your browser.',
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
      'Convert PNG, JPG, BMP, GIF, AVIF and TIFF to WebP — 100% free and private, all in your browser.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        url: '/favicon-120x120.png',
        sizes: '120x120',
        type: 'image/png',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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