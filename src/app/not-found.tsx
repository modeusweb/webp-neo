import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page Not Found | WebP Neo',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#e2e8f0',
        padding: 24,
        fontFamily:
          'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '30rem' }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(120deg, #8b5cf6, #d946ef, #f59e0b)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          404
        </div>
        <h1 style={{ fontSize: 20, margin: '12px 0 0' }}>Page not found</h1>
        <p
          style={{
            color: '#94a3b8',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '8px 0 0',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist. Head back to the
          free image to WebP converter.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '10px 20px',
            borderRadius: 12,
            background: 'linear-gradient(120deg, #8b5cf6, #d946ef)',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Go to WebP Neo
        </Link>
      </div>
    </div>
  );
}