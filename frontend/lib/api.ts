import {
  Category,
  MenuItem,
  Order,
  RestaurantSettings,
  OrderType,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;
  
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Add auth token if available (admin)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('viva-admin-token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // ignore json parse error
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Public
  getMenu: () => request<Category[]>('/menu'),
  getSettings: () => request<RestaurantSettings>('/settings'),
  placeOrder: (orderData: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    order_type: OrderType;
    items: any[];
    comment?: string;
  }) => request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),

  // Admin Auth
  login: (credentials: { email: string; password_hash: string }) => 
    request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Admin Categories
  getCategories: () => request<Category[]>('/admin/menu/categories'),
  createCategory: (data: Partial<Category>) => 
    request<Category>('/admin/menu/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: Partial<Category>) => 
    request<Category>(`/admin/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) => 
    request<void>(`/admin/menu/categories/${id}`, { method: 'DELETE' }),

  // Admin Items
  getItems: () => request<MenuItem[]>('/admin/menu/items'),
  createItem: (data: Partial<MenuItem>) => 
    request<MenuItem>('/admin/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (id: number, data: Partial<MenuItem>) => 
    request<MenuItem>(`/admin/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteItem: (id: number) => 
    request<void>(`/admin/menu/items/${id}`, { method: 'DELETE' }),

  // Admin Orders
  getOrders: () => request<Order[]>('/admin/orders'),
  updateOrder: (id: number, status: string) => 
    request<Order>(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ order_status: status }),
    }),

  // Admin Settings
  updateSettings: (settings: Record<string, string>) => 
    request<void>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
