import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-red-600">
          Viva Napoli
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/menu" className="text-sm font-medium hover:text-red-600 transition-colors">
            Meny
          </Link>
          <Link href="/om-oss" className="text-sm font-medium hover:text-red-600 transition-colors">
            Om oss
          </Link>
          <Link href="/kontakt" className="text-sm font-medium hover:text-red-600 transition-colors">
            Kontakt
          </Link>
          <div className="relative">
             {/* Cart icon placeholder */}
             <Link href="/handlekurv" className="p-2 hover:bg-gray-100 rounded-full transition-colors block">
               🛒
             </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
