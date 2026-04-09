import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-gray-50 pt-12 pb-8">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-3">
        <div>
          <h3 className="mb-4 text-lg font-bold text-red-600">Viva Napoli</h3>
          <p className="text-sm leading-relaxed text-gray-600">
            Ekte italiensk smak på Nesoddtangen. Vi serverer pizza, burger og
            kebab med ferske ingredienser.
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-gray-900">Kontakt oss</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>📍 Gamle Hellviksvei 3, 1459 Nesoddtangen</li>
            <li>📞 90 89 77 77</li>
            <li>🕒 14:00 – 22:00 (Hver dag)</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-gray-900">Snarveier</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link
                href="/menu"
                className="transition-colors hover:text-red-600"
              >
                Meny
              </Link>
            </li>
            <li>
              <Link
                href="/om-oss"
                className="transition-colors hover:text-red-600"
              >
                Om oss
              </Link>
            </li>
            <li>
              <Link
                href="/kontakt"
                className="transition-colors hover:text-red-600"
              >
                Kontakt
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="text-xs text-gray-400 transition-colors hover:text-red-600"
              >
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t pt-8 text-center text-xs text-gray-500">
        <p>
          &copy; {currentYear} Viva Napoli Nesoddtangen. Alle rettigheter
          reservert.
        </p>
      </div>
    </footer>
  );
}
