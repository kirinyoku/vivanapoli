import { MetadataRoute } from 'next';

/**
 * Generates the XML sitemap for the website.
 *
 * This file is automatically served at `/sitemap.xml` by Next.js when using the
 * Metadata Route API. It lists all public, indexable pages along with metadata
 * that helps search engines understand how often content changes and which pages
 * are most important.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vivanapolinotodden.no';

  return [
    {
      url: baseUrl,
      /**
       * The homepage is updated weekly because menu items, promotions, or
       * seasonal content may change.
       */
      lastModified: new Date(),
      changeFrequency: 'weekly',
      /**
       * Priority 1 (highest) indicates that the homepage is the most important
       * page on the site.
       */
      priority: 1,
    },
    {
      url: `${baseUrl}/checkout`,
      /**
       * The checkout page is considered static; its content rarely changes
       * (only when the checkout flow is updated).
       */
      lastModified: new Date(),
      changeFrequency: 'monthly',
      /**
       * Priority 0.5 (medium) because the checkout page is important for users
       * but less relevant for organic search (it's not a content page).
       */
      priority: 0.5,
    },
    /**
     * Note: Other pages (e.g., `/admin`, `/order/success`) are intentionally
     * omitted because they are either private or should not be indexed
     * (as reflected in `robots.ts`).
     */
  ];
}
