/**
 * A menu category (e.g. "Pizza", "Pasta", "Drikke").
 * Categories group MenuItems and are displayed as sections on the menu page.
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

/**
 * A single menu item (e.g. "Pizza Margherita").
 *
 * Supports two price sizes (`small` / `large`) with optional discount prices
 * per size. When `price_small` is null the item only has a single ("large") size.
 * `allergens` is an array of short codes (e.g. "M" for melk, "G" for gluten).
 */
export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price_small: number | null;
  price_large: number | null;
  discount_price_small: number | null;
  discount_price_large: number | null;
  allergens: string[];
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * A category with its items already nested — this is the shape returned by
 * the public `/api/menu` endpoint to avoid N+1 queries on the frontend.
 */
export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  items: MenuItem[];
}

/** Possible states an order can go through from creation to delivery. */
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered';
/** Whether the customer wants the order delivered or will pick it up. */
export type OrderType = 'delivery' | 'pickup';

/**
 * A single line within an order — tracks which menu item was ordered,
 * at what size and unit price, and the total for that line (price × quantity).
 */
export interface OrderItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  size: 'small' | 'large';
  unit_price: number;
  total_price: number;
}

/**
 * A customer order containing multiple items.
 * `order_status` tracks fulfilment progress; `order_type` determines
 * whether delivery address or pickup is relevant.
 */
export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_type: OrderType;
  order_status: OrderStatus;
  items: OrderItem[];
  total_price: number;
  comment: string | null;
  created_at: string;
}

/** Minimal payload for an item inside a create-order request — just IDs and quantity. */
export interface CreateOrderItem {
  menu_item_id: number;
  quantity: number;
  size: 'small' | 'large';
}

/** Full payload sent when placing a new order. */
export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_type: OrderType;
  comment: string;
  items: CreateOrderItem[];
}

/** Admin login credentials. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response returned on successful login — contains the JWT token. */
export interface LoginResponse {
  token: string;
}

/** A single key-value setting stored in the database. */
export interface Setting {
  key: string;
  value: string;
}

/**
 * All restaurant-level settings exposed as a flat object.
 * Fields like `open_time`, `close_time`, `is_open` drive the
 * opening-hours logic and the ShopStatusBadge.
 */
export interface RestaurantSettings {
  address: string;
  phone: string;
  open_time: string;
  close_time: string;
  delivery_time: string;
  min_order_price: string;
  is_open: string;
}
