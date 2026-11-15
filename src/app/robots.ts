import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/admin/', '/api/dispatch', '/api/payments/status'],
    },
    sitemap: 'https://linkthelkov.online/sitemap.xml',
  };
}
