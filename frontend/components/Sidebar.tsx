import Logo from '@/components/ui/Logo';
import CategoryLink from '@/components/ui/CategoryLink';
import ShopStatusBadge from '@/components/ui/ShopStatusBadge';
import { api } from '@/lib/api';
import { MapPin, Phone, Truck, Clock } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

/**
 * Sidebar component – desktop‑only left sidebar with restaurant info and menu navigation.
 *
 * This is a **server component** (no `'use client'`). It fetches menu categories
 * and settings on the server side, so the data is ready when the page loads.
 *
 * Key details:
 * - Automatically prepends a "Tilbud" category if any menu items have discounts.
 * - Falls back to sensible defaults if the API fails (empty menu, hardcoded settings).
 * - Displays restaurant contact info, opening hours, and delivery time in the footer.
 * - Uses `CategoryLink` components that integrate with the scroll spy for active‑state highlighting.
 */
export default async function Sidebar() {
  let categories: Category[] = [];
  let settings: any = {};
  let isManualOpen = true;

  try {
    const [menuData, settingsData] = await Promise.all([
      api.getMenu().catch((err) => {
        console.warn(
          'Sidebar: Menu fetch failed, using empty data:',
          err.message
        );
        return []; // Fallback empty menu
      }),
      api.getSettings().catch((err) => {
        console.warn(
          'Sidebar: Settings fetch failed, using defaults:',
          err.message
        );
        return {
          address: 'Gamle Hellviksvei 3',
          phone: '90 89 77 77',
          delivery_time: '30-60 min',
          is_open: 'true',
          open_time: '14:00',
          close_time: '22:00',
        }; // Fallback default settings
      }),
    ]);

    // menuData will be an empty array if catch was triggered
    const discountItemsCount = (menuData || []).flatMap((cat) =>
      (cat.items || []).filter(
        (item) =>
          item.discount_price_small !== null ||
          item.discount_price_large !== null
      )
    ).length;

    let finalCategories = (menuData || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));

    if (discountItemsCount > 0) {
      finalCategories = [
        { id: -1, name: 'Tilbud', slug: 'tilbud' },
        ...finalCategories,
      ];
    }

    categories = finalCategories;
    settings = settingsData;
    isManualOpen = settings?.is_open !== 'false';
  } catch (error) {
    // This top-level catch is for any logic errors inside the try block
    console.error('Sidebar SSR fatal error:', error);
  }

  return (
    <aside className="border-border-light bg-bg-sidebar hidden h-full flex-col overflow-hidden border-r px-8 py-12 lg:flex">
      <div className="mb-8 shrink-0">
        <Logo className="mb-2 text-4xl" asH1 />
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-accent-gold h-[1px] w-4" />
          <p className="font-body text-text-muted text-[0.7rem] font-bold tracking-[0.2em] uppercase italic">
            Den Beste Matleveringstjenesten i Byen Notodden
          </p>
        </div>

        <div className="flex h-8 origin-left scale-90 items-center">
          <ShopStatusBadge
            isManualClosed={!isManualOpen}
            openTime={settings.open_time}
            closeTime={settings.close_time}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-grow flex-col">
        <p className="text-text-muted mb-2 text-sm font-bold tracking-[0.2em] uppercase opacity-50">
          Meny
        </p>
        <nav className="custom-scrollbar flex-grow overflow-x-hidden overflow-y-auto">
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <CategoryLink href={`#${cat.slug}`}>{cat.name}</CategoryLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-border-light mt-auto shrink-0 space-y-5 border-t pt-10">
        <div className="space-y-4">
          <div className="group flex items-center gap-4 transition-colors">
            <div className="bg-primary/5 group-hover:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors">
              <MapPin className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">
                Adresse
              </span>
              <span className="text-text-dark text-sm font-medium">
                {settings.address || 'Storgata 74, 3674 Notodden'}
              </span>
            </div>
          </div>

          <div className="group flex items-center gap-4 transition-colors">
            <div className="bg-primary/5 group-hover:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors">
              <Phone className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">
                Telefon
              </span>
              <span className="text-text-dark text-sm font-medium">
                {settings.phone || '47 48 44 44'}
              </span>
            </div>
          </div>

          <div className="group flex items-center gap-4 transition-colors">
            <div className="bg-primary/5 group-hover:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors">
              <Truck className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">
                Levering
              </span>
              <span className="text-text-dark text-sm font-medium italic">
                {settings.delivery_time || '60 min'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
