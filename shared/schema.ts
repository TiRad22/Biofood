import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  password: text("password"),
  role: text("role").notNull().default("customer"), // "customer" or "kitchen_staff"
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  available: boolean("available").notNull().default(true),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paymentType: text("payment_type").notNull(), // "prepayment" or "full_payment"
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull(),
  total: integer("total").notNull(),
  pickupTime: text("pickup_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  specialInstructions: text("special_instructions"),
  paymentStatus: text("payment_status").notNull().default("pending"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull().default("unread"),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: integer("total_amount").notNull(),
  timeSlot: text("time_slot").notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  phone: true,
  email: true,
  password: true,
  role: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems);

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  items: true,
  total: true,
  pickupTime: true,
  specialInstructions: true,
});

export const orderItemSchema = z.object({
  menuItemId: z.number(),
  quantity: z.number().min(1),
  notes: z.string(),
});

export const paymentSchema = z.object({
  cardNumber: z.string().min(16).max(16),
  expiryDate: z.string(),
  cvv: z.string().min(3).max(4),
  paymentMethod: z.string(),
});

export const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type User = typeof users.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;