import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-red-600 py-20 lg:py-32">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl text-white">
            <h1 className="mb-6 text-4xl font-extrabold md:text-6xl">
              Ekte italiensk pizza på Nesoddtangen
            </h1>
            <p className="mb-10 text-xl opacity-90 md:text-2xl">
              Vi serverer nystekt pizza, saftige burgere og smakfull kebab.
              Bestill for henting eller levering i dag!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="rounded-full bg-white px-8 py-4 text-lg font-bold text-red-600 shadow-lg transition-colors hover:bg-gray-100"
              >
                Se menyen
              </Link>
              <Link
                href="/kontakt"
                className="rounded-full border-2 border-white bg-transparent px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
              >
                Kontakt oss
              </Link>
            </div>
          </div>
        </div>

        {/* Abstract background shape */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-red-500 opacity-50 blur-3xl" />
      </section>

      {/* Highlights Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 text-4xl text-red-600">🍕</div>
              <h3 className="mb-3 text-xl font-bold">Ferske råvarer</h3>
              <p className="text-gray-600">
                Vi bruker kun de beste ingrediensene for å sikre den autentiske
                smaken.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl text-red-600">🚚</div>
              <h3 className="mb-3 text-xl font-bold">Rask levering</h3>
              <p className="text-gray-600">
                Vi leverer rykende varm mat rett hjem til deg på Nesoddtangen.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl text-red-600">👨‍🍳</div>
              <h3 className="mb-3 text-xl font-bold">Ekte håndverk</h3>
              <p className="text-gray-600">
                Våre kokker har lang erfaring med italiensk matlaging.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
