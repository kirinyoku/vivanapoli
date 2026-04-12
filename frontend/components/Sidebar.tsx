import Logo from '@/components/ui/Logo';
import CategoryLink from '@/components/ui/CategoryLink';
import ShopStatusBadge from '@/components/ui/ShopStatusBadge';
import { api } from '@/lib/api';

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
    categories = menuData;
    settings = settingsData;
    isManualOpen = settings.is_open !== 'false';
  } catch (error) {
    console.error('Failed to fetch sidebar data:', error);
  }

  return (
    <aside className="border-border-light bg-bg-sidebar hidden flex-col border-r px-6 py-10 lg:flex">
      <div className="mb-12">
        <Logo className="mb-1 text-3xl" />
        <p className="font-body text-text-muted text-[0.8rem] tracking-wider uppercase">
          Ekte italiensk siden 2010
        </p>
      </div>

      <nav className="flex-grow">
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryLink href={`#${cat.slug}`}>{cat.name}</CategoryLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="font-body text-text-muted mt-auto pt-8 text-sm">
        <p className="mb-2 flex items-center gap-2">
          <span>📍</span> {settings.address || 'Gamle Hellviksvei 3'}
        </p>
        <p className="mb-2 flex items-center gap-2">
          <span>📞</span> {settings.phone || '90 89 77 77'}
        </p>
        <p className="mb-4 flex items-center gap-2 italic">
          <span>⏱️</span> Levering: {settings.delivery_time || '30-60 min'}
        </p>
        <ShopStatusBadge 
          isManualClosed={!isManualOpen} 
          openTime={settings.open_time}
          closeTime={settings.close_time}
        />
      </div>
    </aside>
  );
}

