import Logo from '@/components/ui/Logo';
import CategoryLink from '@/components/ui/CategoryLink';
import Badge from '@/components/ui/Badge';

const categories = [
  { id: 'pizza', name: 'Pizze Rosse', href: '#pizza' },
  { id: 'mexican', name: 'Mexikansk Pizza', href: '#mexican' },
  { id: 'nyheter', name: 'Nyheter', href: '#nyheter' },
  { id: 'calzone', name: 'Calzone', href: '#calzone' },
  { id: 'burgers', name: 'Burgere', href: '#burgers' },
  { id: 'kebab', name: 'Kebab', href: '#kebab' },
  { id: 'drinks', name: 'Drikke', href: '#drinks' },
];

export default function Sidebar() {
  return (
    <aside className="hidden flex-col border-r border-border-light bg-bg-sidebar px-6 py-10 lg:flex">
      <div className="mb-12">
        <Logo className="mb-1 text-3xl" />
        <p className="font-body text-[0.8rem] tracking-wider text-text-muted uppercase">
          Ekte italiensk siden 2010
        </p>
      </div>

      <nav className="flex-grow">
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryLink href={cat.href} isActive={cat.id === 'pizza'}>
                {cat.name}
              </CategoryLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-8 font-body text-sm text-text-muted">
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
