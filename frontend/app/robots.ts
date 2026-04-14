import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://vivanapolinotodden.no';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/order/success'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
