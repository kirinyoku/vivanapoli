import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import CartPanel from '@/components/CartPanel';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const title = 'Viva Napoli — Den Beste Matleveringstjenesten i Byen Notodden';
const description =
  'Bestill din favorittpizza, burger eller kebab fra VivaNapoli på Nesoddtangen. Rask levering og ferske ingredienser.';
const siteUrl = 'https://vivanapolinotodden.no';

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s | VivaNapoli`,
  },
  description,
  keywords: [
    'pizza',
    'nesoddtangen',
    'takeaway',
    'restaurant',
    'burger',
    'kebab',
    'italiensk',
  ],
  authors: [{ name: 'VivaNapoli' }],
  creator: 'VivaNapoli',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'VivaNapoli',
    locale: 'no_NO',
    type: 'website',
  },
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'VivaNapoli',
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
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 59.56263127217169,
      longitude: 9.264647422863261,
    },
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
    priceRange: '$$',
    servesCuisine: ['Pizza', 'Italian', 'Burger', 'Kebab'],
    menu: 'https://vivanapolinotodden.no/#menu',
    acceptsReservations: 'false',
  };

  return (
    <html
      lang="no"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body flex min-h-full flex-col">
        {children}
        <CartPanel />
      </body>
    </html>
  );
}
