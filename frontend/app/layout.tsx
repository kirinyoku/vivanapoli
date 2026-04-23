/**
 * Root layout for the VivaNapoli Next.js application.
 *
 * This layout provides the common structure for all pages, including:
 * - Font loading and CSS variables for typography
 * - SEO metadata (Open Graph, Twitter Cards, etc.)
 * - Structured data (JSON‑LD) for search engines
 * - Global components (CartPanel)
 *
 * The layout is server‑side rendered; avoid client‑side state or effects here.
 */
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import CartPanel from '@/components/CartPanel';

/**
 * Load custom fonts via Next.js font optimization.
 *
 * The `variable` option exports a CSS variable that can be referenced in
 * `globals.css`. This ensures font families are consistent across the app
 * and reduces layout shift (CLS) because fonts are preloaded.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600'], // Only the semi‑bold weight is needed for headings
  variable: '--font-heading', // Used in `--font-heading` inside `@theme`
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body', // Used in `--font-body` inside `@theme`
});

/**
 * SEO‑related constants.
 *
 * Written in Norwegian because the target audience is in Norway.
 * The title and description appear in search results and social media shares.
 */
const title = 'Viva Napoli — Den Beste Matleveringstjenesten i Byen Notodden';
const description =
  'Bestill din favorittpizza, burger eller kebab fra VivaNapoli på Notodden. Rask levering og ferske ingredienser.';
const siteUrl = 'https://vivanapolinotodden.no';

/**
 * Next.js metadata configuration.
 *
 * This object is used by Next.js to generate `<head>` tags for SEO and social
 * sharing. It follows the Next.js Metadata API (https://nextjs.org/docs/app/api-reference/functions/generate-metadata).
 */
export const metadata: Metadata = {
  title: {
    default: title, // Fallback title when a page doesn't provide its own
    template: `%s | VivaNapoli`, // Template for nested pages (e.g., "Checkout | VivaNapoli")
  },
  description,
  keywords: [
    'pizza',
    'notodden',
    'takeaway',
    'restaurant',
    'burger',
    'kebab',
    'italiensk',
  ],
  authors: [{ name: 'VivaNapoli' }],
  creator: 'VivaNapoli',
  /**
   * `metadataBase` is required for generating absolute URLs for `openGraph` and `twitter` images.
   * It also ensures that relative paths in `alternates.canonical` are resolved correctly.
   */
  metadataBase: new URL(siteUrl),
  /**
   * Canonical URL for the homepage.
   *
   * Using `'/'` relative to `metadataBase` produces `https://vivanapolinotodden.no/`.
   * This helps search engines understand the preferred version of the page.
   */
  alternates: {
    canonical: '/',
  },
  /**
   * Open Graph tags for Facebook, LinkedIn, and other platforms that support OG.
   *
   * `locale: 'no_NO'` indicates that the content is in Norwegian (Norway).
   * `type: 'website'` is appropriate for a homepage.
   */
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'VivaNapoli',
    locale: 'no_NO',
    type: 'website',
  },
  /**
   * Twitter Card configuration.
   *
   * `card: 'summary_large_image'` tells Twitter to display a large image preview
   * when the link is shared. The image itself should be provided via the `images`
   * property if needed (currently omitted because no dedicated social image is defined).
   */
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * JSON‑LD structured data for the restaurant.
   *
   * This object follows the Schema.org `Restaurant` type and provides search
   * engines with detailed information about the business (address, opening hours,
   * cuisine, etc.). It is injected into the `<head>` via a `<script>` tag.
   *
   * @see https://schema.org/Restaurant
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'VivaNapoli',
    /**
     * Placeholder image – should be replaced with a real restaurant logo or
     * hero image that represents the business. The image must be accessible
     * via the provided URL.
     */
    image: 'https://vivanapolinotodden.no/next.svg', // Replace with real logo/hero image
    '@id': 'https://vivanapolinotodden.no',
    url: 'https://vivanapolinotodden.no',
    telephone: '90897777',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Storgata 74',
      addressLocality: 'Notodden',
      postalCode: '3674',
      addressCountry: 'NO',
    },
    /**
     * Geographic coordinates of the restaurant.
     *
     * Used by mapping services and local search. The values correspond to the
     * actual location of VivaNapoli in Notodden, Norway.
     */
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 59.56263127217169,
      longitude: 9.264647422863261,
    },
    /**
     * Opening hours for every day of the week.
     *
     * The restaurant is open from 11:00 to 21:00 all week. If hours differ
     * by day, multiple `OpeningHoursSpecification` objects would be needed.
     */
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '11:00',
        closes: '21:00',
      },
    ],
    /**
     * Price range indicator (`$` = inexpensive, `$$$$` = very expensive).
     *
     * `$$` suggests a moderate price level, typical for a casual dining restaurant.
     */
    priceRange: '$$',
    /**
     * Cuisine types served.
     *
     * These should match the actual menu offerings. Adding more specific
     * terms (e.g., "Neapolitan Pizza") could improve local SEO.
     */
    servesCuisine: ['Pizza', 'Italian', 'Burger', 'Kebab'],
    /**
     * Link to the online menu.
     *
     * Currently points to the in‑page anchor `#menu`. If a separate menu page
     * exists, the URL should be updated accordingly.
     */
    menu: 'https://vivanapolinotodden.no/#menu',
    /**
     * Whether the restaurant accepts reservations.
     *
     * Set to `'false'` because VivaNapoli is a takeaway/delivery‑focused
     * establishment. The value must be a string per Schema.org expectations.
     */
    acceptsReservations: 'false',
  };

  return (
    /**
     * The root `<html>` element.
     *
     * - `lang="no"` sets the document language to Norwegian, which helps screen
     *   readers and search engines.
     * - The `className` injects the CSS variables for fonts (`--font-heading`,
     *   `--font-body`) and ensures the page height is full (`h-full`).
     * - `antialiased` enables sub‑pixel antialiasing for smoother text rendering.
     */
    <html
      lang="no"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {/**
         * Inline JSON‑LD script.
         *
         * `dangerouslySetInnerHTML` is necessary because we need to embed raw JSON
         * as a script block. The content is static and fully controlled by us,
         * so there is no XSS risk.
         */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/**
       * The `<body>` uses a flex column layout to push the cart panel to the bottom
       * while allowing the main content (`children`) to grow.
       *
       * `font-body` applies the Inter font family defined in `globals.css`.
       */}
      <body className="font-body flex min-h-full flex-col">
        {children}
        {/**
         * The cart panel is rendered outside the page content so that it is always
         * visible (fixed positioning) and does not interfere with the layout of
         * individual pages.
         */}
        <CartPanel />
      </body>
    </html>
  );
}
