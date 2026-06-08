// Core domain types for the Discount Aggregator API

export type Platform = 'AMAZON' | 'FLIPKART' | 'MYNTRA' | 'SNAPDEAL' | 'MEESHO';

export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'APPLE';

export type AutoCheckoutAction = 'TRIGGERED' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export type DiscountType = 'flat' | 'percent';

export type SortField = 'discount_pct' | 'value_score' | 'price_asc' | 'price_desc' | 'recency';

// ─── Product Listing ─────────────────────────────────────────────────────────

export interface ProductListing {
  id: string;
  platform: Platform;
  platform_product_id: string;
  name: string;
  brand: string;
  model_number: string;
  category: string;
  current_price: number;
  original_price: number;
  discount_pct: number;
  url: string;
  image_url: string;
  attributes: Record<string, string>;
  value_score: number | null;
  fake_discount_flag: boolean;
  low_confidence_score: boolean;
  last_fetched_at: Date;
  is_available: boolean;
}

// ─── Price History ────────────────────────────────────────────────────────────

export interface PriceHistoryEntry {
  product_listing_id: string;
  platform: Platform;
  price: number;
  recorded_at: Date;
}

// ─── Product Match ────────────────────────────────────────────────────────────

export interface ProductMatch {
  id: string;
  canonical_product_id: string;
  listing_ids: string[];
  confidence_score: number; // 0–100
  verified: boolean;
  created_at: Date;
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

export interface Deal {
  listing: ProductListing;
  price_history?: PriceHistoryEntry[];
  bank_offers?: BankOffer[];
  matched_listings?: ProductListing[];
}

// ─── Bank Offer ───────────────────────────────────────────────────────────────

export interface BankOffer {
  id: string;
  platform: Platform;
  bank_name: string;
  card_types: string[];
  discount_type: DiscountType;
  value: number;          // flat amount or percentage
  max_cap: number;        // max discount cap (0 = no cap)
  min_order: number;      // minimum order value to apply
  valid_until: Date;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  listing_id: string;
  platform: Platform;
  added_at: Date;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  updated_at: Date;
}

export interface CartGroup {
  platform: Platform;
  items: CartItem[];
  subtotal: number;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  user_id: string;
  listing_id: string;
  price_at_add: number;
  target_price: number | null;
  added_at: Date;
  last_notified_at: Date | null;
}

// ─── Deal Feed ────────────────────────────────────────────────────────────────

export interface DealFeedSubmission {
  id: string;
  user_id: string;
  url: string;
  platform: Platform;
  listing_id: string;
  description: string;
  value_score: number;
  upvotes: number;
  downvotes: number;
  is_hidden: boolean;
  submitted_at: Date;
}

// ─── Auto-Checkout ────────────────────────────────────────────────────────────

export interface AutoCheckoutTrigger {
  id: string;
  user_id: string;
  listing_id: string;
  target_price: number;
  is_active: boolean;
  created_at: Date;
  last_attempted_at: Date | null;
}

export interface AutoCheckoutAuditEntry {
  id: string;
  trigger_id: string;
  user_id: string;
  action: AutoCheckoutAction;
  details: Record<string, unknown>;
  occurred_at: Date;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password_hash: string;
  auth_provider: AuthProvider;
  is_premium: boolean;
  last_active_at: Date;
  created_at: Date;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  token: string;       // tokenized reference only — never raw card data
  bank_name: string;
  card_type: string;
  last4: string;
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

export interface ScraperOutput {
  platform: Platform;
  product_id: string;
  name: string;
  price: number;
  original_price: number;
  discount_pct: number;
  url: string;
  image_url: string;
  attributes: Record<string, string>;
}

// ─── Search / Filter ──────────────────────────────────────────────────────────

export interface SearchFilters {
  q?: string;
  platform?: Platform;
  min_discount?: number;
  min_value_score?: number;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: SortField;
}

// ─── AI Scoring ───────────────────────────────────────────────────────────────

export interface ScoringInput {
  current_price: number;
  original_price: number;
  price_history: PriceHistoryEntry[];
  category_avg_discount: number;
}

export interface ScoringOutput {
  value_score: number;          // integer [0, 100]
  fake_discount_flag: boolean;
  low_confidence_score: boolean;
}
