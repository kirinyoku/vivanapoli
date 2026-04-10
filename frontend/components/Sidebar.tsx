import Logo from '@/components/ui/Logo';
import CategoryLink from '@/components/ui/CategoryLink';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default async function Sidebar() {
  let categories: Category[] = [];
  try {
    categories = await api.getMenu();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
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
          <span>📍</span> Gamle Hellviksvei 3
        </p>
        <p className="mb-4 flex items-center gap-2">
          <span>📞</span> 90 89 77 77
        </p>
        <Badge variant="success">Åpent til 22:00</Badge>
      </div>
    </aside>
  );
}
