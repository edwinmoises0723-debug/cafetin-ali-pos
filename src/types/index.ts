export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  hasTax?: boolean; // Por defecto true
  stock?: number;
  minStock?: number;
  maxStock?: number;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status?: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export interface Order {
  id: string;
  tableNumber: number;
  tableName: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'paused';
  createdAt: Date;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  customerName?: string;
}

export interface KitchenOrder {
  id: string;
  orderId: string;
  tableNumber: number;
  tableName: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready';
  createdAt: Date;
  priority: 'normal' | 'high' | 'urgent';
}

export interface Table {
  id: number;
  name: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'paused';
  currentOrder?: Order;
}

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export interface PausedOrder {
  id: string;
  table: Table;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  tipPercentage: number;
  createdAt: Date;
  customerName?: string;
}

export type Role = 'admin' | 'supervisor' | 'cajero' | 'mesero' | 'cocina';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
}
