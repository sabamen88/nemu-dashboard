import { pgTable, text, integer, boolean, timestamp, jsonb, uuid, decimal } from "drizzle-orm/pg-core";

// ─── Sellers ──────────────────────────────────────────────────────────────────
export const sellers = pgTable("sellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  storeName: text("store_name").notNull(),
  storeSlug: text("store_slug").notNull().unique(),
  category: text("category").notNull().default("Umum"),
  description: text("description"),
  logoUrl: text("logo_url"),
  inviteCode: text("invite_code").notNull().unique(),
  phone: text("phone"),
  // AI Agent
  agentStatus: text("agent_status").notNull().default("inactive"), // inactive | provisioning | active | error
  agentPort: integer("agent_port"),
  agentWalletAddress: text("agent_wallet_address"),
  agentSpongeId: text("agent_sponge_id"),
  agentApiKey: text("agent_api_key"),
  agentChatflowId: text("agent_chatflow_id"), // Flowise chatflow ID
  aiCustomPrompt: text("ai_custom_prompt"), // Custom system prompt personality
  autoReply: boolean("auto_reply").notNull().default(true),
  // open-claw.id Agent Social Network
  openclawApiKey: text("openclaw_api_key"),
  openclawClaimUrl: text("openclaw_claim_url"),
  openclawAgentId: text("openclaw_agent_id"),
  openclawAgentName: text("openclaw_agent_name"),
  // Bank / payment details (used in order confirmations)
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  // Meta
  tokoId: text("toko_id").unique(),
  isFoundingSeller: boolean("is_founding_seller").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull(), // IDR, no decimals
  stock: integer("stock").notNull().default(0),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  variants: jsonb("variants").$type<{ name: string; options: string[] }[]>().default([]),
  status: text("status").notNull().default("active"), // active | draft | archived
  weight: integer("weight"), // grams
  sku: text("sku"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  items: jsonb("items").$type<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    variant?: string;
  }[]>().notNull(),
  total: decimal("total", { precision: 12, scale: 0 }).notNull(),
  status: text("status").notNull().default("pending"), // pending | confirmed | shipped | done | cancelled
  notes: text("notes"),
  shippingAddress: text("shipping_address"),
  paymentMethod: text("payment_method"),
  // Agent commerce
  isAgentOrder: boolean("is_agent_order").notNull().default(false),
  agentTxHash: text("agent_tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  buyerPhone: text("buyer_phone").notNull(),
  buyerName: text("buyer_name"),
  content: text("content").notNull(),
  direction: text("direction").notNull(), // inbound | outbound
  handledBy: text("handled_by").notNull().default("agent"), // agent | seller
  isEscalated: boolean("is_escalated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Wallet Events ────────────────────────────────────────────────────────────
export const walletEvents = pgTable("wallet_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // receive | send | x402_receive
  amount: text("amount").notNull(), // USDC
  chain: text("chain").notNull().default("base"),
  txHash: text("tx_hash"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types
export type Seller = typeof sellers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type WalletEvent = typeof walletEvents.$inferSelect;
