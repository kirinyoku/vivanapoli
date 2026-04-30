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

/**
 * Extended fetch options adding URL query params and a fallback value
 * that is returned on error instead of throwing — useful for gracefully
 * degrading parts of the UI when the API is unavailable.
 */
type FetchOptions<T> = RequestInit & {
  params?: Record<string, string>;
  fallback?: T;
};

/** Standardised API response wrapper: the real payload lives under `data`. */
interface ApiResponse<T> {
  data: T;
  error?: string;
}

/**
 * Typed error class that carries the HTTP status code alongside the message.
 * Used by callers (e.g. `useAdminAuth`) to distinguish 401 Unauthorized
 * from other failures and react accordingly (e.g. redirect to login).
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Core request function used by every method in the `api` object.
 *
 * Features:
 *  - Auto-attaches `Content-Type: application/json` unless the body is FormData.
 *  - Reads the admin JWT from `localStorage` and adds it as a Bearer token
 *    (only on the client — `typeof window !== 'undefined'` guards SSR).
 *  - Retries up to `retries` (default 2) times on 5xx / 429 responses and
 *    on network errors, with a 1 s delay between attempts.
 *  - Accepts an optional `fallback` value: when provided, a failed request
 *    returns the fallback instead of throwing, allowing the UI to degrade
 *    gracefully during startup or offline scenarios.
 *  - Handles 204 No Content and zero-length responses by returning `undefined`.
 */
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

      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[API] ${init.method || 'GET'} ${endpoint} failed (${response.status}): ${errorMessage}`
        );
      }

      // ── Auto‑logout on 401 Unauthorized ──────────────────────
      // When the admin JWT expires (after 24 h) the backend returns 401.
      // Callers (e.g. `useAdminAuth.handleApiError`) are responsible for
      // clearing the token and redirecting to the login page.
      if (response.status === 401) {
        throw new ApiError(errorMessage, response.status);
      }

      // Retry for 5xx errors or network issues
      if (retries > 0 && (response.status >= 500 || response.status === 429)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[API] Retrying ${endpoint}... (${retries} left)`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return request(endpoint, options, retries - 1);
      }

      if (fallback !== undefined) return fallback;
      throw new ApiError(errorMessage, response.status);
    }

    // Handle 204 No Content and other empty responses
    /**
     * Handle empty responses (204 No Content, or explicit zero-length body).
     * Some endpoints (DELETE, some PUTs) return no data, which would cause
     * JSON.parse to throw on an empty string.
     */
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

    /**
     * Network errors — `fetch` itself threw (e.g. DNS failure, connection refused).
     * These are distinct from HTTP error responses handled above.
     */
    if (retries > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[API] Network error, retrying ${endpoint}... (${retries} left)`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return request(endpoint, options, retries - 1);
    }

    let errorMessage =
      'Kunne ikke koble til serveren. Vennligst sjekk internettforbindelsen din.';
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[API] Request ${endpoint} failed: ${errorMessage}`);
    }

    if (fallback !== undefined) return fallback;
    throw new ApiError(errorMessage, 503);
  }
}

/**
 * Typed API client wrapping every backend endpoint.
 *
 * Methods are grouped by domain:
 *  - Public (menu, settings, orders)
 *  - Admin auth
 *  - Admin CRUD (categories, items, orders, settings)
 *
 * Every method delegates to the internal `request()` function which
 * handles auth headers, JSON parsing, retries, and error normalisation.
 */
export const api = {
  // ── Public endpoints ────────────────────────────────────────
  getMenu: () =>
    request<MenuCategory[]>('/menu', {
      next: { revalidate: 3600, tags: ['menu'] },
    } as any),
  getSettings: () =>
    request<RestaurantSettings>('/settings', {
      next: { revalidate: 3600, tags: ['settings'] },
    } as any),
  placeOrder: (orderData: CreateOrderRequest) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  // ── Admin authentication ────────────────────────────────────
  login: (credentials: LoginRequest) =>
    request<LoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // ── Admin category management ────────────────────────────────
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

  // ── Admin order management ───────────────────────────────────
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
