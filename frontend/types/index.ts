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
  allergens: string[];
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
export type OrderType = 'delivery' | 'pickup';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: 'small' | 'large';
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

export interface Setting {
  key: string;
  value: string;
}

export interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  opening_hours: string;
  delivery_time: string;
  currency: string;
  language: string;
}
