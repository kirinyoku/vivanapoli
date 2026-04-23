'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { getShopStatus, ShopStatus } from '@/lib/opening-hours';
import { Order, OrderStatus, RestaurantSettings } from '@/types';
import Badge from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  PlusCircle,
  Power,
  ChevronRight,
  AlertCircle,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Admin dashboard – main overview page for the admin panel.
 *
 * Displays key metrics (orders, revenue, average order value), recent orders,
 * shop status with a toggle button, and quick shortcuts. Data is fetched from
 * the backend on mount and refreshed every 2 minutes.
 *
 * The component uses `Promise.allSettled` to handle partial API failures
 * gracefully (e.g., if settings fail to load, the dashboard still shows
 * orders and stats). The shop status toggle uses an optimistic update pattern
 * for a snappier user experience.
 */
export default function AdminDashboard() {
  const { handleApiError } = useAdminAuth();
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        api.getStats(),
        api.getOrders(),
        api.getSettings(),
      ]);

      // Process results
      const statsData =
        results[0].status === 'fulfilled'
          ? results[0].value
          : { total_orders: 0, total_revenue: 0 };
      const ordersData =
        results[1].status === 'fulfilled' ? results[1].value : [];
      const settingsData =
        results[2].status === 'fulfilled' ? results[2].value : null;

      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 5));
      setSettings(settingsData);

      // Show error only if critical data failed
      if (results[2].status === 'rejected') {
        setError('Kunne ikke hente innstillinger');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('Failed to fetch dashboard data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Update shop status when settings change or every minute for real-time updates
  useEffect(() => {
    if (!settings) return;

    const updateStatus = () => {
      const isManualClosed = settings.is_open === 'false';
      const status = getShopStatus(
        settings.open_time,
        settings.close_time,
        isManualClosed
      );
      setShopStatus(status);
    };

    updateStatus();
    // Update every minute to keep status fresh
    const timer = setInterval(updateStatus, 60000);
    return () => clearInterval(timer);
  }, [settings]);

  const handleToggleShop = async () => {
    if (!settings) return;

    const previousSettings = settings;
    const newStatus = settings.is_open === 'false' ? 'true' : 'false';

    // Optimistic update
    setSettings({ ...settings, is_open: newStatus });
    setToggleError(null);
    setToggleLoading(true);

    try {
      // Prepare settings object for API - must match Record<string, string> type
      const updatePayload: Record<string, string> = {
        address: settings.address,
        phone: settings.phone,
        open_time: settings.open_time,
        close_time: settings.close_time,
        delivery_time: settings.delivery_time,
        min_order_price: settings.min_order_price,
        is_open: newStatus,
      };
      await api.updateSettings(updatePayload);
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings);
      const errorMsg =
        err instanceof Error ? err.message : 'Kunne ikke endre status';
      setToggleError(errorMsg);
      console.error('Toggle shop status failed:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading && recentOrders.length === 0)
    return <div className="p-8 text-center">Laster oversikt...</div>;

  const avgOrder =
    stats.total_orders > 0
      ? Math.round(stats.total_revenue / stats.total_orders)
      : 0;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-text-dark text-4xl font-bold tracking-tight">
            Oversikt
          </h1>
          <p className="text-text-muted italic opacity-70">
            Sanntidsoppdatering av restaurantens aktivitet.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="border-border-light/60 cursor-pointer rounded-xl border bg-white p-3 transition-all hover:shadow-md active:scale-95"
          title="Oppdater data"
        >
          <Clock
            className={cn('text-primary h-5 w-5', loading && 'animate-spin')}
          />
        </button>
      </div>

      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 duration-300">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
          <p className="text-sm font-bold tracking-wider text-red-900 uppercase">
            {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="ring-border-light/60 flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-black/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-text-muted mb-1 text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">
              Ordrer i dag
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-text-dark text-4xl font-black">
                {stats.total_orders}
              </span>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-500">
                +12%
              </span>
            </div>
          </div>
        </div>

        <div className="ring-border-light/60 flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-black/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 shadow-inner">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-text-muted mb-1 text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">
              Omsetning i dag
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-text-dark text-4xl font-black">
                {stats.total_revenue}
              </span>
              <span className="text-text-muted text-xl font-bold opacity-40">
                ,-
              </span>
            </div>
          </div>
        </div>

        <div className="ring-border-light/60 flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-black/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shadow-inner">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-text-muted mb-1 text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">
              Gjennomsnitt
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-text-dark text-4xl font-black">
                {avgOrder}
              </span>
              <span className="text-text-muted text-xl font-bold opacity-40">
                ,-
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Recent Orders */}
        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-text-dark text-xl font-bold tracking-tight">
              Siste bestillinger
            </h2>
            <Link
              href="/admin/orders"
              className="text-primary flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase hover:underline"
            >
              Se alle <ChevronRight size={12} />
            </Link>
          </div>

          <div className="ring-border-light/60 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 shadow-black/[0.02]">
            <div className="divide-border-light/40 divide-y">
              {recentOrders.length === 0 ? (
                <div className="text-text-muted p-20 text-center italic opacity-40">
                  Ingen bestillinger registrert ennå
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="group hover:bg-bg-page/50 flex items-center justify-between p-6 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3',
                          order.order_status === 'new'
                            ? 'bg-primary text-white'
                            : 'bg-bg-page text-text-muted'
                        )}
                      >
                        #{order.id}
                      </div>
                      <div>
                        <p className="text-text-dark group-hover:text-primary mb-1.5 leading-none font-bold transition-colors">
                          {order.customer_name}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-text-muted text-[10px] font-bold tracking-tighter uppercase opacity-60">
                            {formatDate(order.created_at)}
                          </span>
                          <div className="bg-border-light h-1 w-1 rounded-full" />
                          <span className="text-text-muted text-[10px] font-bold tracking-tighter uppercase italic opacity-60">
                            {order.order_type === 'delivery'
                              ? 'Kjøring'
                              : 'Henting'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <p className="text-text-dark text-lg font-black">
                        {order.total_price},-
                      </p>
                      <div className="flex w-24 justify-end">
                        <Badge
                          variant={
                            order.order_status === 'new' ? 'hot' : 'outline'
                          }
                          className={cn(
                            'px-3 py-1',
                            order.order_status === 'new' && 'animate-pulse'
                          )}
                        >
                          {order.order_status === 'new'
                            ? 'NY'
                            : order.order_status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8 lg:col-span-4">
          {/* Shop Status Widget */}
          <div className="ring-border-light/60 rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-black/[0.02]">
            <h2 className="text-text-dark mb-6 text-sm font-bold tracking-widest uppercase opacity-40">
              Butikkstatus
            </h2>

            {toggleError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-[10px] font-bold tracking-wider text-red-600 uppercase">
                Feil: {toggleError}
              </div>
            )}

            <div
              className={cn(
                'flex flex-col gap-6 rounded-2xl p-6 transition-all duration-500',
                shopStatus?.status === 'open'
                  ? 'bg-green-50 ring-1 ring-green-100'
                  : 'bg-red-50 ring-1 ring-red-100'
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg',
                    shopStatus?.status === 'open'
                      ? 'bg-white text-green-600 shadow-green-200/50'
                      : 'bg-white text-red-600 shadow-red-200/50'
                  )}
                >
                  <Power
                    size={24}
                    className={cn(toggleLoading && 'animate-pulse')}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      'text-xs font-black tracking-widest uppercase',
                      shopStatus?.status === 'open'
                        ? 'text-green-700'
                        : 'text-red-700'
                    )}
                  >
                    {shopStatus?.status === 'open' ? 'ÅPEN' : 'STENGT'}
                  </p>
                  <p className="text-[10px] leading-tight font-medium italic opacity-60">
                    {shopStatus?.message}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleShop}
                disabled={toggleLoading}
                className={cn(
                  'w-full cursor-pointer rounded-xl py-3 text-xs font-bold tracking-widest uppercase shadow-md transition-all active:scale-95',
                  settings?.is_open === 'false'
                    ? 'bg-green-600 text-white shadow-green-200 hover:bg-green-700'
                    : 'bg-red-600 text-white shadow-red-200 hover:bg-red-700'
                )}
              >
                {toggleLoading
                  ? 'Vennligst vent...'
                  : `Skru ${settings?.is_open === 'false' ? 'PÅ' : 'AV'}`}
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="ring-border-light/60 rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-black/[0.02]">
            <h2 className="text-text-dark mb-6 text-sm font-bold tracking-widest uppercase opacity-40">
              Snarveier
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/admin/menu"
                className="group bg-bg-page/50 hover:bg-primary flex items-center gap-4 rounded-2xl p-4 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110">
                  <PlusCircle size={20} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold transition-colors group-hover:text-white">
                    Legg til produkt
                  </p>
                  <p className="text-text-muted text-[9px] font-bold tracking-wider uppercase transition-colors group-hover:text-white/60">
                    Menystyring
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/settings"
                className="group bg-bg-page/50 flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 hover:bg-[#1a1a1a]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110">
                  <Settings size={20} className="text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold transition-colors group-hover:text-white">
                    Endre priser
                  </p>
                  <p className="text-text-muted text-[9px] font-bold tracking-wider uppercase transition-colors group-hover:text-white/60">
                    Instillinger
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
