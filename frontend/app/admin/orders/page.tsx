'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { Order, OrderStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Price from '@/components/ui/Price';
import { cn, formatDate } from '@/lib/utils';
import { Clock } from 'lucide-react';

export default function OrdersManagementPage() {
  const { handleApiError } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      // Sort by date descending
      setOrders(
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setError(null);
      await api.updateOrder(id, newStatus);
      fetchOrders();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Feil ved oppdatering av status';
      setError(errorMessage);
      console.error('Failed to update order status:', err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchTerm) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 'hot';
      case 'confirmed':
        return 'success';
      case 'preparing':
        return 'outline';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'ghost';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: OrderStatus | 'all') => {
    switch (status) {
      case 'all':
        return 'Alle';
      case 'new':
        return 'Nye';
      case 'confirmed':
        return 'Bekreftet';
      case 'preparing':
        return 'Lages';
      case 'ready':
        return 'Klare';
      case 'delivered':
        return 'Levert';
      default:
        return status;
    }
  };

  if (loading && orders.length === 0)
    return <div className="p-8 text-center">Laster bestillinger...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-text-dark text-4xl font-bold tracking-tight">
            Bestillinger
          </h1>
          <p className="text-text-muted italic opacity-70">
            Håndter inngående bestillinger i sanntid.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="border-border-light/60 group flex cursor-pointer items-center gap-2 rounded-xl border bg-white p-3 transition-all hover:shadow-md active:scale-95"
        >
          <Clock
            className={cn('text-primary h-4 w-4', loading && 'animate-spin')}
          />
          <span className="text-text-muted group-hover:text-primary text-[10px] font-black tracking-widest uppercase transition-colors">
            Oppdater
          </span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="ring-border-light/60 rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-black/[0.02]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <label
              htmlFor="search"
              className="text-text-muted px-1 text-[10px] font-black tracking-[0.2em] uppercase opacity-60"
            >
              Søk etter kunde eller ID
            </label>
            <div className="group relative">
              <input
                id="search"
                type="text"
                placeholder="F.eks. Ola Nordmann..."
                className="border-border-light/60 bg-bg-page/50 focus:ring-primary/5 focus:border-primary w-full rounded-2xl border p-4 pl-12 shadow-inner transition-all outline-none focus:ring-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="text-text-muted group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 opacity-40 transition-all group-focus-within:opacity-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-none space-y-2">
            <label className="text-text-muted px-1 text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
              Filter status
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'all',
                  'new',
                  'confirmed',
                  'preparing',
                  'ready',
                  'delivered',
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'h-10 cursor-pointer rounded-xl border px-4 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95',
                    statusFilter === status
                      ? 'bg-primary border-primary shadow-primary/20 text-white shadow-lg'
                      : 'text-text-muted border-border-light/60 hover:bg-bg-page bg-white'
                  )}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="ring-border-light/60 rounded-[2.5rem] bg-white p-20 text-center shadow-xl ring-1 shadow-black/[0.02]">
            <p className="text-text-muted font-medium italic opacity-60">
              {searchTerm || statusFilter !== 'all'
                ? 'Ingen bestillinger samsvarer med valgt filter'
                : 'Ingen bestillinger i listen ennå'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={cn(
                'overflow-hidden rounded-[2.5rem] bg-white shadow-xl ring-1 shadow-black/[0.02] transition-all duration-500',
                order.order_status === 'new'
                  ? 'ring-primary/20 shadow-primary/[0.03] scale-[1.01]'
                  : 'ring-border-light/60'
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-6 border-b px-8 py-6',
                  order.order_status === 'new'
                    ? 'bg-primary/[0.02] border-primary/10'
                    : 'bg-bg-page/20 border-border-light/40'
                )}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold shadow-sm transition-transform group-hover:scale-110',
                      order.order_status === 'new'
                        ? 'bg-primary animate-pulse text-white'
                        : 'text-text-dark border-border-light/60 border bg-white'
                    )}
                  >
                    #{order.id}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <Badge
                        variant={getStatusVariant(order.order_status)}
                        className="px-3 py-0.5 text-[9px] font-black tracking-[0.2em] uppercase"
                      >
                        {getStatusLabel(order.order_status)}
                      </Badge>
                      <span className="text-text-muted text-[10px] font-bold tracking-tighter uppercase opacity-60">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <p className="text-text-dark text-xl font-black tracking-tight">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                <div className="ring-border-light/40 flex items-center gap-4 rounded-2xl bg-white/50 p-2 ring-1">
                  <span className="text-text-muted pl-2 text-[9px] font-black tracking-widest uppercase">
                    Oppdater status:
                  </span>
                  <select
                    className="text-text-dark focus:ring-primary/20 cursor-pointer rounded-xl border-none bg-white px-4 py-2 text-xs font-bold shadow-sm outline-none focus:ring-2"
                    value={order.order_status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                  >
                    <option value="new">🆕 Ny bestilling</option>
                    <option value="confirmed">✅ Bekreftet</option>
                    <option value="preparing">🍳 Lages nå</option>
                    <option value="ready">🥡 Klar til henting</option>
                    <option value="delivered">🚚 Levert</option>
                  </select>
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
                {/* Left: Customer Info */}
                <div className="border-border-light/40 space-y-8 border-b p-8 lg:col-span-5 lg:border-r lg:border-b-0">
                  <div>
                    <h3 className="text-text-muted mb-4 px-1 text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                      Kunde & Levering
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-bg-page text-text-muted flex h-10 w-10 items-center justify-center rounded-xl">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 011.94.86l-.85 5.02a1 1 0 01-.92.83H7.89a11.05 11.05 0 006.22 6.22v-1.61a1 1 0 01.83-.92l5.02-.85a1 1 0 011.13.67L22 18.11a1 1 0 01-1.1 1.24H9.31a19 19 0 01-8.68-8.68A1 1 0 011.24 3h.2a1 1 0 01.95.6l.33.72z"
                            />
                          </svg>
                        </div>
                        <span className="text-text-dark text-sm font-bold">
                          {order.customer_phone}
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-bg-page text-text-muted mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-text-dark text-sm leading-snug font-bold">
                            {order.order_type === 'delivery'
                              ? order.customer_address
                              : 'Hentes i restaurant'}
                          </span>
                          <Badge
                            variant="outline"
                            className="mt-1 w-fit px-2 py-0 text-[8px] font-black tracking-widest uppercase"
                          >
                            {order.order_type === 'delivery'
                              ? 'UTKJØRING'
                              : 'HENTING'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.comment && (
                    <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
                      <div className="font-heading absolute -right-2 -bottom-2 text-4xl font-black text-amber-600/10 italic">
                        "
                      </div>
                      <h4 className="mb-2 text-[9px] font-black tracking-widest text-amber-700 uppercase">
                        Beskjed:
                      </h4>
                      <p className="text-sm leading-relaxed text-amber-900 italic">
                        {order.comment}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Items */}
                <div className="bg-bg-page/10 flex h-full flex-col p-8 lg:col-span-7">
                  <h3 className="text-text-muted mb-6 px-1 text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                    Bestillingsinnhold
                  </h3>
                  <div className="flex-grow space-y-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="group/item flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-primary ring-border-light/40 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black italic shadow-sm ring-1 transition-transform group-hover/item:scale-110">
                            x{item.quantity}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-text-dark text-sm font-bold">
                              {item.name}
                            </span>
                            {item.size && (
                              <span className="text-text-muted text-[9px] font-black tracking-widest uppercase opacity-60">
                                {item.size === 'large' ? 'Stor' : 'Liten'}
                              </span>
                            )}
                          </div>
                        </div>
                        <Price
                          amount={item.total_price}
                          className="text-text-dark text-sm font-bold"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-border-light/60 mt-8 flex items-center justify-between border-t pt-6">
                    <div>
                      <span className="text-text-muted block text-[9px] font-black tracking-[0.3em] uppercase opacity-40">
                        Totalsum inkl. mva
                      </span>
                      <span className="text-text-dark text-2xl leading-none font-black">
                        Sum
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <Price
                        amount={order.total_price}
                        className="text-primary text-3xl font-black"
                      />
                      <span className="text-text-muted text-xs font-bold opacity-40">
                        ,-
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
