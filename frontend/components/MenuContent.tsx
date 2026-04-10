import SectionTitle from '@/components/ui/SectionTitle';
import MenuItem from '@/components/ui/MenuItem';
import Logo from '@/components/ui/Logo';
import CartTrigger from '@/components/ui/CartTrigger';
import ScrollSpy from '@/components/ScrollSpy';
import { api } from '@/lib/api';

export default async function MenuContent() {
  let categories = [];
  try {
    categories = await api.getMenu();
  } catch (error) {
    console.error('Failed to fetch menu:', error);
  }

  const categorySlugs = categories.map((cat) => cat.slug);

  return (
    <div className="h-full overflow-y-auto px-6 py-10 lg:px-12 lg:py-16 scroll-smooth">
      <ScrollSpy categories={categorySlugs} />

      {/* Mobile Header */}
      <header className="mb-8 flex items-center justify-between lg:hidden">
        <Logo className="text-2xl" />
        <CartTrigger />
      </header>

      {categories.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-text-muted">Kunne ikke laste menyen.</p>
        </div>
      ) : (
        categories.map((category) => (
          <section key={category.id} id={category.slug} className="mb-16">
            <SectionTitle title={category.name} />
            <div className="grid gap-10">
              {category.items.map((item) => (
                <MenuItem key={item.id} {...item} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
