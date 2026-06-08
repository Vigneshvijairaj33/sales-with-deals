'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `
    -- Enable extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- Platform enum
    CREATE TYPE platform_enum AS ENUM ('AMAZON', 'FLIPKART', 'MYNTRA', 'SNAPDEAL', 'MEESHO');

    -- Auth provider enum
    CREATE TYPE auth_provider_enum AS ENUM ('EMAIL', 'GOOGLE', 'APPLE');

    -- Autocheckout action enum
    CREATE TYPE autocheckout_action_enum AS ENUM ('TRIGGERED', 'SUCCESS', 'FAILED', 'CANCELLED');

    -- Discount type enum
    CREATE TYPE discount_type_enum AS ENUM ('flat', 'percent');

    -- ─── Users ────────────────────────────────────────────────────────────────
    CREATE TABLE users (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT,
      auth_provider   auth_provider_enum NOT NULL DEFAULT 'EMAIL',
      is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
      last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- ─── Payment Methods ──────────────────────────────────────────────────────
    CREATE TABLE payment_methods (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT NOT NULL,
      bank_name   TEXT NOT NULL,
      card_type   TEXT NOT NULL,
      last4       TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

    -- ─── Product Listings ─────────────────────────────────────────────────────
    CREATE TABLE product_listings (
      id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      platform              platform_enum NOT NULL,
      platform_product_id   TEXT NOT NULL,
      name                  TEXT NOT NULL,
      brand                 TEXT NOT NULL DEFAULT '',
      model_number          TEXT NOT NULL DEFAULT '',
      category              TEXT NOT NULL DEFAULT '',
      current_price         NUMERIC(12,2) NOT NULL,
      original_price        NUMERIC(12,2) NOT NULL,
      discount_pct          NUMERIC(5,2) NOT NULL DEFAULT 0,
      url                   TEXT NOT NULL,
      image_url             TEXT NOT NULL DEFAULT '',
      attributes            JSONB NOT NULL DEFAULT '{}',
      value_score           SMALLINT,
      fake_discount_flag    BOOLEAN NOT NULL DEFAULT FALSE,
      low_confidence_score  BOOLEAN NOT NULL DEFAULT FALSE,
      last_fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_available          BOOLEAN NOT NULL DEFAULT TRUE,
      search_vector         TSVECTOR,
      UNIQUE (platform, platform_product_id)
    );
    CREATE INDEX idx_listings_platform ON product_listings(platform);
    CREATE INDEX idx_listings_category ON product_listings(category);
    CREATE INDEX idx_listings_search ON product_listings USING GIN(search_vector);
    CREATE INDEX idx_listings_value_score ON product_listings(value_score DESC);

    -- Auto-update search vector
    CREATE OR REPLACE FUNCTION update_listing_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_listing_search_vector
    BEFORE INSERT OR UPDATE ON product_listings
    FOR EACH ROW EXECUTE FUNCTION update_listing_search_vector();

    -- ─── Price History ────────────────────────────────────────────────────────
    -- Note: Convert to TimescaleDB hypertable after creation if TimescaleDB is available
    CREATE TABLE price_history (
      product_listing_id  UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
      platform            platform_enum NOT NULL,
      price               NUMERIC(12,2) NOT NULL,
      recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_price_history_listing ON price_history(product_listing_id, recorded_at DESC);

    -- ─── Product Matches ──────────────────────────────────────────────────────
    CREATE TABLE product_matches (
      id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      canonical_product_id  UUID NOT NULL,
      listing_ids           UUID[] NOT NULL,
      confidence_score      NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
      verified              BOOLEAN NOT NULL DEFAULT FALSE,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_matches_canonical ON product_matches(canonical_product_id);

    -- ─── Bank Offers ──────────────────────────────────────────────────────────
    CREATE TABLE bank_offers (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      platform       platform_enum NOT NULL,
      bank_name      TEXT NOT NULL,
      card_types     TEXT[] NOT NULL,
      discount_type  discount_type_enum NOT NULL,
      value          NUMERIC(10,2) NOT NULL,
      max_cap        NUMERIC(10,2) NOT NULL DEFAULT 0,
      min_order      NUMERIC(10,2) NOT NULL DEFAULT 0,
      valid_until    TIMESTAMPTZ NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_bank_offers_platform ON bank_offers(platform);

    -- ─── Carts ────────────────────────────────────────────────────────────────
    CREATE TABLE carts (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      items       JSONB NOT NULL DEFAULT '[]',
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- ─── Wishlists ────────────────────────────────────────────────────────────
    CREATE TABLE wishlists (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id        UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
      price_at_add      NUMERIC(12,2) NOT NULL,
      target_price      NUMERIC(12,2),
      added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_notified_at  TIMESTAMPTZ,
      UNIQUE(user_id, listing_id)
    );
    CREATE INDEX idx_wishlists_user ON wishlists(user_id);
    CREATE INDEX idx_wishlists_listing ON wishlists(listing_id);

    -- ─── Deal Feed Submissions ────────────────────────────────────────────────
    CREATE TABLE deal_feed_submissions (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url          TEXT NOT NULL,
      platform     platform_enum NOT NULL,
      listing_id   UUID REFERENCES product_listings(id),
      description  TEXT NOT NULL DEFAULT '',
      value_score  SMALLINT NOT NULL DEFAULT 0,
      upvotes      INTEGER NOT NULL DEFAULT 0,
      downvotes    INTEGER NOT NULL DEFAULT 0,
      is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_feed_hidden ON deal_feed_submissions(is_hidden, submitted_at DESC);

    -- ─── Auto-Checkout Triggers ───────────────────────────────────────────────
    CREATE TABLE autocheckout_triggers (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id        UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
      target_price      NUMERIC(12,2) NOT NULL,
      is_active         BOOLEAN NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_attempted_at TIMESTAMPTZ
    );
    CREATE INDEX idx_triggers_user ON autocheckout_triggers(user_id);
    CREATE INDEX idx_triggers_listing_active ON autocheckout_triggers(listing_id, is_active);

    -- ─── Auto-Checkout Audit Log ──────────────────────────────────────────────
    CREATE TABLE autocheckout_audit_log (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      trigger_id  UUID NOT NULL REFERENCES autocheckout_triggers(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action      autocheckout_action_enum NOT NULL,
      details     JSONB NOT NULL DEFAULT '{}',
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_audit_trigger ON autocheckout_audit_log(trigger_id, occurred_at DESC);
    `,
    callback,
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `
    DROP TABLE IF EXISTS autocheckout_audit_log CASCADE;
    DROP TABLE IF EXISTS autocheckout_triggers CASCADE;
    DROP TABLE IF EXISTS deal_feed_submissions CASCADE;
    DROP TABLE IF EXISTS wishlists CASCADE;
    DROP TABLE IF EXISTS carts CASCADE;
    DROP TABLE IF EXISTS bank_offers CASCADE;
    DROP TABLE IF EXISTS product_matches CASCADE;
    DROP TABLE IF EXISTS price_history CASCADE;
    DROP TABLE IF EXISTS product_listings CASCADE;
    DROP TABLE IF EXISTS payment_methods CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TYPE IF EXISTS discount_type_enum CASCADE;
    DROP TYPE IF EXISTS autocheckout_action_enum CASCADE;
    DROP TYPE IF EXISTS auth_provider_enum CASCADE;
    DROP TYPE IF EXISTS platform_enum CASCADE;
    `,
    callback,
  );
};
