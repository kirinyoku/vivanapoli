'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { getShopStatus, ShopStatus } from '@/lib/opening-hours';
import { Order, OrderStatus, RestaurantSettings } from '@/types';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  PlusCircle,
  Power,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oversikt</h1>
          <p className="text-sm text-gray-500">
            Sanntidsoppdatering av dagens aktivitet.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="text-primary hover:text-primary-dark cursor-pointer text-xs font-medium transition-colors duration-200 hover:underline"
        >
          Oppdater data
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 flex-shrink-0 text-red-600"
          />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Kunne ikke hente data
            </p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Ordrer i dag
            </p>
            <p className="text-2xl font-black text-gray-900">
              {stats.total_orders}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-green-50 p-3 text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Omsetning i dag
            </p>
            <p className="text-2xl font-black text-gray-900">
              {stats.total_revenue},-
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Gjennomsnitt
            </p>
            <p className="text-2xl font-black text-gray-900">{avgOrder},-</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Siste bestillinger
            </h2>
            <Link
              href="/admin/orders"
              className="text-primary hover:text-primary-dark flex cursor-pointer items-center gap-1 text-sm font-bold transition-colors duration-200 hover:underline"
            >
              Se alle ordrer <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-400 italic">
                  Ingen bestillinger registrert ennå
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="group flex cursor-pointer items-center justify-between p-4 transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-2 w-2 rounded-full ${order.order_status === 'new' ? 'animate-pulse bg-red-500' : 'bg-gray-300'}`}
                      ></div>
                      <div>
                        <p className="group-hover:text-primary font-bold text-gray-900 transition-colors">
                          #{order.id} - {order.customer_name}
                        </p>
                        <p className="text-[10px] font-bold tracking-tighter text-gray-400 uppercase">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="font-black text-gray-900">
                        {order.total_price},-
                      </p>
                      <div className="flex w-24 justify-end">
                        <Badge
                          variant={
                            order.order_status === 'new' ? 'hot' : 'outline'
                          }
                        >
                          {order.order_status === 'new'
                            ? 'Ny'
                            : order.order_status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Butikkstatus
            </h2>

            {toggleError && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle size={18} className="flex-shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Feil ved statusoppdatering
                  </p>
                  <p className="text-xs text-red-700">{toggleError}</p>
                </div>
              </div>
            )}

            <div
              className={`flex w-full items-center justify-between rounded-2xl border-2 p-5 transition-all duration-200 ${
                shopStatus?.status === 'open'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${shopStatus?.status === 'open' ? 'bg-green-200' : 'bg-red-200'}`}
                >
                  <Power size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black tracking-tight uppercase">
                    {shopStatus?.status === 'open'
                      ? 'Butikken er ÅPEN'
                      : 'Butikken er STENGT'}
                  </p>
                  <p className="text-[10px] font-bold italic opacity-70">
                    {shopStatus?.message || 'Laster status...'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleShop}
                disabled={toggleLoading}
                className="rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 hover:cursor-pointer hover:opacity-80 active:scale-95"
              >
                {toggleLoading ? 'Oppdaterer...' : `Skru ${settings?.is_open === 'false' ? 'på' : 'av'}`}
              </button>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Snarveier</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/admin/menu"
                className="hover:border-primary/50 hover:bg-primary/5 group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md"
              >
                <div className="group-hover:bg-primary/10 group-hover:text-primary rounded-lg bg-gray-50 p-2 transition-all duration-200">
                  <PlusCircle size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Legg til produkt</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Oppdater menyen
                  </p>
                </div>
              </Link>

              {recentOrders.some((o) => o.order_status === 'new') && (
                <div className="animate-in fade-in slide-in-from-right-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 duration-500">
                  <AlertCircle className="shrink-0 text-amber-600" size={20} />
                  <div>
                    <p className="text-sm font-black tracking-tight text-amber-800 uppercase">
                      Nye bestillinger!
                    </p>
                    <p className="text-xs font-medium text-amber-700">
                      Sjekk ordrelisten for å bekrefte nye henvendelser.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
