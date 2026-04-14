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

export default async function Sidebar() {
  let categories: Category[] = [];
  let settings: any = {};
  let isManualOpen = true;

  try {
    const [menuData, settingsData] = await Promise.all([
      api.getMenu(),
      api.getSettings(),
    ]);

    // Collect all items with discounts
    const discountItemsCount = menuData.flatMap(cat => 
      cat.items.filter(item => item.discount_price_small !== null || item.discount_price_large !== null)
    ).length;

    let finalCategories = menuData.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug }));
    if (discountItemsCount > 0) {
      finalCategories = [{ id: -1, name: 'Tilbud', slug: 'tilbud' }, ...finalCategories];
    }

    categories = finalCategories;
    settings = settingsData;
    isManualOpen = settings.is_open !== 'false';
  } catch (error) {
    console.error('Failed to fetch sidebar data:', error);
  }

  return (
    <aside className="border-border-light bg-bg-sidebar hidden flex-col border-r px-8 py-12 lg:flex">
      <div className="mb-16">
        <Logo className="mb-2 text-4xl" asH1 />
        <div className="flex items-center gap-2">
          <div className="h-[1px] w-4 bg-accent-gold" />
          <p className="font-body text-text-muted text-[0.7rem] font-bold tracking-[0.2em] uppercase italic">
            Ekte italiensk siden 2010
          </p>
        </div>
      </div>

      <nav className="flex-grow">
        <p className="text-text-muted mb-6 text-[0.7rem] font-bold tracking-[0.2em] uppercase opacity-50">
          Meny
        </p>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryLink href={`#${cat.slug}`}>{cat.name}</CategoryLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-border-light mt-auto space-y-5 border-t pt-10">
        <div className="space-y-4">
          <div className="group flex items-center gap-4 transition-colors">
            <div className="bg-primary/5 group-hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full transition-colors">
              <MapPin className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">
                Adresse
              </span>
              <span className="text-text-dark text-sm font-medium">
                {settings.address || 'Gamle Hellviksvei 3'}
              </span>
            </div>
          </div>

          <div className="group flex items-center gap-4 transition-colors">
            <div className="bg-primary/5 group-hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full transition-colors">
              <Phone className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">
                Telefon
              </span>
              <span className="text-text-dark text-sm font-medium">
                {settings.phone || '90 89 77 77'}
              </span>
            </div>
          </div>

          <div className="group flex items-center gap-4 transition-colors">
            <div className="bg-primary/5 group-hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full transition-colors">
              <Truck className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">
                Levering
              </span>
              <span className="text-text-dark text-sm font-medium italic">
                {settings.delivery_time || '30-60 min'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <ShopStatusBadge 
            isManualClosed={!isManualOpen} 
            openTime={settings.open_time}
            closeTime={settings.close_time}
          />
        </div>
      </div>
    </aside>
  );
}

