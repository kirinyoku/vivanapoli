import {
  Category,
  MenuItem,
  MenuCategory,
  Order,
  CreateOrderRequest,
  LoginRequest,
  LoginResponse,
  RestaurantSettings,
  OrderType,
} from '../types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

type FetchOptions<T> = RequestInit & {
  params?: Record<string, string>;
  fallback?: T;
};

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: FetchOptions<T> = {},
  retries = 2
): Promise<T> {
  const { params, fallback, ...init } = options;

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

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Server responded with ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.data?.error || errorMessage;
      } catch {
        // use default message
      }
      
      console.warn(`[API] ${init.method || 'GET'} ${endpoint} failed (${response.status}): ${errorMessage}`);
      
      // Retry for 5xx errors or network issues
      if (retries > 0 && (response.status >= 500 || response.status === 429)) {
        console.log(`[API] Retrying ${endpoint}... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return request(endpoint, options, retries - 1);
      }

      if (fallback !== undefined) return fallback;
      throw new ApiError(errorMessage, response.status);
    }

    // Handle 204 No Content and other empty responses
    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined as unknown as T;
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Network errors (fetch failed entirely)
    if (retries > 0) {
      console.log(`[API] Network error, retrying ${endpoint}... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return request(endpoint, options, retries - 1);
    }

    let errorMessage = 'Kunne ikke koble til serveren. Vennligst sjekk internettforbindelsen din.';
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    console.warn(`[API] Request ${endpoint} failed: ${errorMessage}`);
    
    if (fallback !== undefined) return fallback;
    throw new ApiError(errorMessage, 503);
  }
}

export const api = {
  // Public
  getMenu: () => request<MenuCategory[]>('/menu'),
  getSettings: () => request<RestaurantSettings>('/settings'),
  placeOrder: (orderData: CreateOrderRequest) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  // Admin Auth
  login: (credentials: LoginRequest) =>
    request<LoginResponse>('/admin/login', {
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
  getStats: () =>
    request<{ total_orders: number; total_revenue: number }>('/admin/stats'),
  updateOrder: (id: number, status: string) =>
    request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: status }),
    }),

  // Admin Settings
  updateSettings: (settings: Record<string, string>) =>
    request<void>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
