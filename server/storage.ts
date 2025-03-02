import { 
  type User, type InsertUser,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type OrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Menu operations
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItemAvailability(id: number, available: boolean): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<void>;
  updateOrderPaymentStatus(id: number, status: string): Promise<void>;

  // Analytics operations
  getPopularItems(): Promise<{ id: number; name: string; quantity: number; totalAmount: number }[]>;
  getOrdersByTimeSlot(): Promise<{ timeSlot: string; orderCount: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private analytics: Map<number, any>; 
  private currentIds: { users: number; menuItems: number; orders: number };
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.analytics = new Map(); 
    this.currentIds = { users: 1, menuItems: 1, orders: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Add sample menu items
    const sampleItems: InsertMenuItem[] = [
      {
        name: "Классический круассан",
        description: "Слоеное масляное тесто, приготовленное по французскому рецепту. КБЖУ на 100г: 280 ккал, белки - 5г, жиры - 14г, углеводы - 32г",
        price: 250,
        category: "Выпечка",
        imageUrl: "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606",
        available: true,
      },
      {
        name: "Тост с авокадо",
        description: "Хлеб на закваске с пюре из спелого авокадо. КБЖУ на 100г: 220 ккал, белки - 6г, жиры - 12г, углеводы - 25г",
        price: 290,
        category: "Завтраки",
        imageUrl: "https://images.unsplash.com/photo-1494390248081-4e521a5940db",
        available: true,
      },
      {
        name: "Капучино",
        description: "Эспрессо с нежной молочной пенкой. КБЖУ на 100мл: 65 ккал, белки - 3г, жиры - 3.5г, углеводы - 6г",
        price: 220,
        category: "Напитки",
        imageUrl: "https://images.unsplash.com/photo-1447078806655-40579c2520d6",
        available: true,
      },
      {
        name: "Греческий салат",
        description: "Свежие овощи, оливки и сыр фета с оливковым маслом. КБЖУ на 100г: 160 ккал, белки - 4г, жиры - 14г, углеводы - 7г",
        price: 280,
        category: "Салаты",
        imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
        available: true,
      },
      {
        name: "Грибной крем-суп",
        description: "Нежный суп-пюре из шампиньонов со сливками. КБЖУ на 100г: 95 ккал, белки - 3г, жиры - 6г, углеводы - 8г",
        price: 260,
        category: "Супы",
        imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd",
        available: true,
      },
      {
        name: "Цезарь с курицей",
        description: "Классический салат с куриным филе и соусом Цезарь. КБЖУ на 100г: 210 ккал, белки - 14г, жиры - 16г, углеводы - 8г",
        price: 310,
        category: "Салаты",
        imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
        available: true,
      },
      {
        name: "Борщ",
        description: "Традиционный суп со сметаной и зеленью. КБЖУ на 100г: 85 ккал, белки - 4г, жиры - 3.5г, углеводы - 11г",
        price: 270,
        category: "Супы",
        imageUrl: "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e",
        available: true,
      },
      {
        name: "Американо",
        description: "Классический черный кофе. КБЖУ на 100мл: 10 ккал, белки - 0.1г, жиры - 0.1г, углеводы - 0г",
        price: 180,
        category: "Напитки",
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
        available: true,
      },
      {
        name: "Панкейки",
        description: "Пышные блинчики с кленовым сиропом и ягодами. КБЖУ на 100г: 250 ккал, белки - 6г, жиры - 9г, углеводы - 38г",
        price: 240,
        category: "Завтраки",
        imageUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93",
        available: true,
      },
      {
        name: "Чизкейк",
        description: "Нежный десерт из сливочного сыра с ягодным соусом. КБЖУ на 100г: 320 ккал, белки - 7г, жиры - 23г, углеводы - 26г",
        price: 230,
        category: "Десерты",
        imageUrl: "https://images.unsplash.com/photo-1524351199678-941a58a3df50",
        available: true,
      }
    ];

    sampleItems.forEach((item) => this.createMenuItem(item));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "customer",
      password: insertUser.password || null,
      email: insertUser.email || null
    };
    this.users.set(id, user);
    return user;
  }

  // Menu operations
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentIds.menuItems++;
    const item: MenuItem = { ...insertItem, id, available: insertItem.available ?? true };
    this.menuItems.set(id, item);
    return item;
  }

  async updateMenuItemAvailability(id: number, available: boolean): Promise<void> {
    const item = this.menuItems.get(id);
    if (item) {
      this.menuItems.set(id, { ...item, available });
    }
  }

  // Order operations
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentIds.orders++;
    const order: Order = {
      ...insertOrder,
      id,
      status: "pending",
      createdAt: new Date(),
      paymentStatus: "pending",
      userId: insertOrder.userId || null,
      specialInstructions: insertOrder.specialInstructions || null
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      this.orders.set(id, { ...order, status });
    }
  }

  async updateOrderPaymentStatus(id: number, status: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      this.orders.set(id, { ...order, paymentStatus: status });
    }
  }

  // Analytics operations
  async getPopularItems(): Promise<{ id: number; name: string; quantity: number; totalAmount: number }[]> {
    const items = new Map<number, { name: string; quantity: number; totalAmount: number }>();

    // Собираем статистику из заказов
    for (const order of this.orders.values()) {
      const orderItems = order.items as OrderItem[];
      for (const item of orderItems) {
        const menuItem = await this.getMenuItem(item.menuItemId);
        if (!menuItem) continue;

        const existing = items.get(item.menuItemId) || { 
          name: menuItem.name, 
          quantity: 0, 
          totalAmount: 0 
        };

        items.set(item.menuItemId, {
          name: menuItem.name,
          quantity: existing.quantity + item.quantity,
          totalAmount: existing.totalAmount + (menuItem.price * item.quantity)
        });
      }
    }

    return Array.from(items.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  async getOrdersByTimeSlot(): Promise<{ timeSlot: string; orderCount: number }[]> {
    const timeSlots = new Map<string, number>();

    for (const order of this.orders.values()) {
      const timeSlot = order.pickupTime;
      timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
    }

    return Array.from(timeSlots.entries()).map(([timeSlot, orderCount]) => ({
      timeSlot,
      orderCount
    })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }
}

export const storage = new MemStorage();