import SectionTitle from '@/components/ui/SectionTitle';
import MenuItem from '@/components/ui/MenuItem';
import Logo from '@/components/ui/Logo';
import CartTrigger from '@/components/ui/CartTrigger';

const mockPizza = [
  {
    id: '1',
    name: '01. Margherita',
    description: 'Tomatsaus, fersk mozzarella, basilikum, olivenolje',
    price: 189,
    allergens: ['M', 'H'],
  },
  {
    id: '2',
    name: '02. Diavola',
    description: 'Tomatsaus, mozzarella, ventricina salami, chili, oregano',
    price: 215,
    allergens: ['M', 'H'],
  },
  {
    id: '3',
    name: '03. Nduja Speciale',
    description:
      'Tomatsaus, mozzarella, sterk nduja fra Spilinga, rødløk, oliven',
    price: 235,
    isHot: true,
    allergens: ['M', 'H'],
  },
];

const mockMexican = [
  {
    id: '15',
    name: '15. El Paso',
    description: 'Kjøttdeig, jalapeños, nachochips, tacokrydder',
    price: 220,
    allergens: ['M', 'H'],
  },
];

export default function MenuContent() {
  return (
    <div className="h-full overflow-y-auto px-6 py-10 lg:px-12 lg:py-16">
      {/* Mobile Header */}
      <header className="mb-8 flex items-center justify-between lg:hidden">
        <Logo className="text-2xl" />
        <CartTrigger count={2} />
      </header>

      <section id="pizza" className="mb-16">
        <SectionTitle
          title="Pizze Rosse"
          description="Laget med San Marzano tomater og fersk mozzarella"
        />
        <div className="grid gap-10">
          {mockPizza.map((item) => (
            <MenuItem key={item.id} {...item} />
          ))}
        </div>
      </section>

      <section id="mexican" className="mb-16">
        <SectionTitle
          title="Mexikansk Pizza"
          description="Kombinasjonen av Italia og Mexico"
        />
        <div className="grid gap-10">
          {mockMexican.map((item) => (
            <MenuItem key={item.id} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
