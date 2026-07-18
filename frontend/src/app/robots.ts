import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taskbridge.com';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/forgot-password'],
      disallow: [
        '/dashboard/',
        '/superadmin/',
        '/onboarding/',
        '/api/',
        '/2fa',
        '/verify-email/',
        '/verify-email-sent',
        '/verify-email-change/',
        '/reset-password/',
        '/accept-invite/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
