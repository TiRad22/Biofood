import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertOrderSchema,
  orderItemSchema,
  paymentSchema,
  loginSchema,
} from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Middleware to check if user is authenticated and has correct role
function requireRole(role: string) {
  return async (req: Request, res: any, next: any) => {
    console.log('Checking role:', role);
    console.log('Session:', req.session);

    if (!req.session.userId) {
      console.log('No userId in session');
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    console.log('Found user:', user);

    if (!user || user.role !== role) {
      console.log('User role mismatch:', user?.role, 'expected:', role);
      return res.status(403).json({ error: "Forbidden" });
    }

    console.log('Role check passed');
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      store: storage.sessionStore,
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Auth routes
  app.get("/api/user", async (req: Request, res) => {
    console.log('GET /api/user - Session:', req.session);
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    console.log('Found user:', user);
    res.json(user);
  });

  app.post("/api/register", async (req: Request, res) => {
    try {
      console.log('POST /api/register - Body:', req.body);
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password if provided
      let hashedPassword = null;
      if (userData.password) {
        hashedPassword = await hashPassword(userData.password);
      }

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      console.log('Created user and set session:', user);

      res.json(user);
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/login", async (req: Request, res) => {
    try {
      console.log('POST /api/login - Body:', req.body);
      const { phone, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByPhone(phone);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      console.log('Login successful, set session:', user);
      res.json(user);
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  app.post("/api/logout", (req: Request, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Menu routes
  app.get("/api/menu", async (_req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  // Orders routes
  app.post("/api/orders", async (req, res) => {
    try {
      console.log('Creating new order:', req.body);
      const orderData = insertOrderSchema.parse(req.body);
      const items = z.array(orderItemSchema).parse(orderData.items);

      // Validate all menu items exist and are available
      for (const item of items) {
        const menuItem = await storage.getMenuItem(item.menuItemId);
        if (!menuItem || !menuItem.available) {
          console.log('Menu item not available:', item.menuItemId);
          return res.status(400).json({
            error: `Menu item ${item.menuItemId} not available`,
          });
        }
      }

      const order = await storage.createOrder(orderData);
      console.log('Order created successfully:', order);
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.get("/api/orders", requireRole("kitchen_staff"), async (_req, res) => {
    console.log('GET /api/orders - Fetching orders');
    try {
      const orders = await storage.getOrders();
      console.log('Found orders:', orders);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/orders/:id/status", requireRole("kitchen_staff"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = z.string().parse(req.body.status);

      await storage.updateOrderStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(400).json({ error: "Invalid status" });
    }
  });

  // Protected kitchen routes
  app.use("/api/kitchen/*", requireRole("kitchen_staff"));


  // Payment routes
  app.post("/api/orders/:id/payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const paymentData = paymentSchema.parse(req.body);
      const paymentType = req.query.type || "prepayment";

      console.log('Processing payment for order:', orderId, 'type:', paymentType);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const amount =
        paymentType === "prepayment"
          ? Math.floor(order.total * 0.5)
          : order.total - Math.floor(order.total * 0.5);

      // Обновляем статус заказа
      const newPaymentStatus =
        paymentType === "prepayment" ? "partially_paid" : "paid";
      await storage.updateOrderStatus(orderId, "preparing");
      await storage.updateOrderPaymentStatus(orderId, newPaymentStatus);

      console.log('Payment processed successfully');
      res.json({ success: true });
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/popular-items", async (_req, res) => {
    const analytics = await storage.getPopularItems();
    res.json(analytics);
  });

  app.get("/api/analytics/time-slots", async (_req, res) => {
    const analytics = await storage.getOrdersByTimeSlot();
    res.json(analytics);
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const notifications = await storage.getUserNotifications(userId);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.markNotificationAsRead(id);
    res.json({ success: true });
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const user = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByPhone(user.phone);

      if (existingUser) {
        res.json(existingUser);
      } else {
        const newUser = await storage.createUser(user);
        res.json(newUser);
      }
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}