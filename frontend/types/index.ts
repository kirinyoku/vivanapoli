export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

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

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  items: MenuItem[];
}

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered';
export type OrderType = 'delivery' | 'pickup';

export interface OrderItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  size: 'small' | 'large';
  unit_price: number;
  total_price: number;
}

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

export interface CreateOrderItem {
  menu_item_id: number;
  quantity: number;
  size: 'small' | 'large';
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_type: OrderType;
  comment: string;
  items: CreateOrderItem[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface RestaurantSettings {
  address: string;
  phone: string;
  open_time: string;
  close_time: string;
  delivery_time: string;
  min_order_price: string;
  is_open: string;
}
