'use client';

import { useState, useEffect } from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import MenuItem from '@/components/ui/MenuItem';
import MenuItemSkeleton from '@/components/ui/MenuItemSkeleton';
import Logo from '@/components/ui/Logo';
import CartTrigger from '@/components/ui/CartTrigger';
import ScrollSpy from '@/components/ScrollSpy';
import { api } from '@/lib/api';
import { Category, RestaurantSettings } from '@/types';
import ShopStatusBadge from '@/components/ui/ShopStatusBadge';
import { MapPin, Phone, Clock, Truck } from 'lucide-react';
import CategoryLink from '@/components/ui/CategoryLink';

export default function MenuContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getMenu(), api.getSettings()])
      .then(([menuData, settingsData]) => {
        setCategories(menuData);
        setSettings(settingsData);
      })
      .catch((err) => {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Kunne ikke laste menyen.');
      })
      .finally(() => setLoading(false));
  }, []);

  const categorySlugs = categories.map((cat) => cat.slug);

  return (
    <div id="menu-scroll-container" className="h-full overflow-y-auto px-4 py-0 lg:px-12 lg:py-16 scroll-smooth">
      <ScrollSpy categories={categorySlugs} />

      {/* Mobile Header - Sticky at the very top */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 bg-bg-page/95 backdrop-blur-md px-4 pt-4 lg:hidden shadow-sm">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Logo className="text-xl" />
            {!loading && settings && (
              <div className="h-6 flex items-center scale-75 origin-left">
                <ShopStatusBadge 
                  isManualClosed={settings.is_open === 'false'} 
                  openTime={settings.open_time}
                  closeTime={settings.close_time}
                />
              </div>
            )}
          </div>
          <CartTrigger className="scale-90" />
        </header>
        
        {/* Mobile Category Nav */}
        <nav className="no-scrollbar -mx-4 flex items-center gap-0 overflow-x-auto border-b border-border-light/40 px-2 pb-1 min-h-[44px]">
          {loading ? (
            <div className="flex gap-4 px-4 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          ) : !error && categories.length > 0 ? (
            categories.map((cat) => (
              <CategoryLink 
                key={cat.id} 
                href={`#${cat.slug}`}
                variant="horizontal"
                className="px-3"
              >
                {cat.name}
              </CategoryLink>
            ))
          ) : null}
        </nav>
      </div>

      {loading ? (
        <div className="space-y-12 pt-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-7 w-32 rounded bg-gray-200 animate-pulse" />
              <div className="grid gap-6">
                <MenuItemSkeleton />
                <MenuItemSkeleton />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <p className="text-red-500 font-medium px-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-primary hover:underline text-sm font-bold"
          >
            Prøv igjen
          </button>
        </div>
      ) : (
        <>
          <div className="pt-2">
            {categories.map((category) => (
              <section key={category.id} id={category.slug} className="mb-12 last:mb-16 lg:mb-24">
                <SectionTitle title={category.name} className="mb-6 lg:mb-12" />
                <div className="grid grid-cols-1 gap-x-12 gap-y-6 lg:gap-y-12 xl:grid-cols-2">
                  {category.items.map((item) => (
                    <MenuItem key={item.id} {...item} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Mobile Only Footer */}
          <footer className="border-t border-border-light/40 mt-8 mb-20 py-10 lg:hidden">
            <Logo className="mb-6 text-2xl" />
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-full">
                  <MapPin className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">Adresse</span>
                  <span className="text-text-dark text-sm font-medium">{settings?.address || 'Gamle Hellviksvei 3'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-full">
                  <Phone className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">Telefon</span>
                  <span className="text-text-dark text-sm font-medium">{settings?.phone || '90 89 77 77'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-full">
                  <Truck className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">Levering</span>
                  <span className="text-text-dark text-sm font-medium italic">{settings?.delivery_time || '30-60 min'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-full">
                  <Clock className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase opacity-60">Åpningstider</span>
                  <span className="text-text-dark text-sm font-medium">{settings?.open_time} - {settings?.close_time}</span>
                </div>
              </div>
            </div>
            
            <p className="mt-12 text-center text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">
              © 2026 Viva Napoli — Ekte italiensk siden 2010
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
