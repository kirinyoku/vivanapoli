'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { Order, OrderStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Bestillinger</h1>
        <button
          onClick={fetchOrders}
          className="text-primary hover:text-primary-dark cursor-pointer self-end text-sm transition-colors duration-200 hover:underline sm:self-auto"
        >
          Oppdater nå
        </button>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label
              htmlFor="search"
              className="mb-1 block cursor-default text-xs font-medium text-gray-500 uppercase"
            >
              Søk
            </label>
            <input
              id="search"
              type="text"
              placeholder="Søk på ID, navn или telefon..."
              className="w-full cursor-text rounded-md border border-gray-300 px-3 py-2 transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-none">
            <label className="mb-1 block cursor-default text-xs font-medium text-gray-500 uppercase">
              Status
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
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-all duration-200 ${
                    statusFilter === status
                      ? 'border-red-600 bg-red-600 text-white shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow">
            {searchTerm || statusFilter !== 'all'
              ? 'Ingen bestillinger samsvarer med filteret'
              : 'Ingen bestillinger funnet'}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-gray-900">
                    #{order.id}
                  </span>
                  <Badge variant={getStatusVariant(order.order_status)}>
                    {getStatusLabel(order.order_status)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="cursor-default text-xs font-medium text-gray-500 uppercase">
                    Endre status:
                  </label>
                  <select
                    className="cursor-pointer rounded-md border border-gray-300 text-sm transition-all duration-200 hover:border-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
                    value={order.order_status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                  >
                    <option value="new">Ny</option>
                    <option value="confirmed">Bekreftet</option>
                    <option value="preparing">Lages</option>
                    <option value="ready">Klar</option>
                    <option value="delivered">Levert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-medium tracking-wider text-gray-500 uppercase">
                    Kundeinformasjon
                  </h3>
                  <p className="font-semibold text-gray-900">
                    {order.customer_name}
                  </p>
                  <p className="text-gray-600">{order.customer_phone}</p>
                  <p className="text-gray-600">{order.customer_address}</p>
                  <div className="mt-2">
                    <Badge variant="outline">
                      {order.order_type === 'delivery' ? 'Kjøring' : 'Henting'}
                    </Badge>
                  </div>
                  {order.comment && (
                    <div className="mt-4 rounded border border-yellow-100 bg-yellow-50 p-3 text-sm italic">
                      "{order.comment}"
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium tracking-wider text-gray-500 uppercase">
                    Bestilte varer
                  </h3>
                  <ul className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between py-2">
                        <div className="flex items-start space-x-2">
                          <span className="font-bold text-gray-900">
                            {item.quantity}x
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.size === 'large' ? 'Stor' : 'Liten'}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-600">
                          {item.total_price},-
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-red-600">
                      {order.total_price},- NOK
                    </span>
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
