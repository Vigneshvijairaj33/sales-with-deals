# Requirements Document

## Introduction

A multi-platform e-commerce discount aggregator app that collects, compares, and surfaces discounted products from major platforms like Amazon, Flipkart, and others. Users can compare prices across platforms, detect fake discounts using AI, optimize payment methods for maximum savings, and complete purchases through the respective platforms. The app includes crowdsourced deal feeds, multi-store wishlists, and premium auto-checkout capabilities.

## Glossary

- **Platform**: An e-commerce marketplace (e.g., Amazon, Flipkart, Myntra)
- **Product_Listing**: A product entry from a specific platform with price, discount, and metadata
- **Deal**: A discounted Product_Listing surfaced by the Aggregator
- **Value_Score**: An AI-computed score representing the true value of a discount (0–100)
- **Fake_Discount**: A deal where the "original price" was artificially inflated to exaggerate savings
- **Aggregator**: The core system responsible for collecting, normalizing, and serving deal data
- **Price_History**: A time-series record of a product's price on a given platform
- **Matched_Product**: A product identified as equivalent across two or more platforms
- **Cart**: A user's collection of selected deals pending purchase
- **Wishlist**: A user's saved products monitored for price changes
- **Deal_Feed**: A community-contributed stream of deals submitted by users
- **Bank_Offer**: A platform-specific discount available when paying with a particular card or bank
- **Auto_Checkout_Bot**: A premium agent that completes a purchase on behalf of the user

---

## Requirements

### Requirement 1: Data Collection from Platforms

**User Story:** As a user, I want to see up-to-date discounted products from major platforms, so that I can find the best deals without visiting each site manually.

#### Acceptance Criteria

1. THE Aggregator SHALL support data ingestion from at least Amazon and Flipkart at launch.
2. WHEN a platform provides an official API, THE Aggregator SHALL prefer the API over scraping.
3. WHEN no official API is available, THE Aggregator SHALL use a scraping pipeline to collect product data.
4. WHEN a scraping request is blocked or fails, THE Aggregator SHALL retry with exponential backoff and log the failure.
5. THE Aggregator SHALL refresh product data at intervals no longer than 30 minutes for active deals.
6. WHEN a product listing is fetched, THE Aggregator SHALL store the fetched price and timestamp in Price_History.

---

### Requirement 2: Real-Time Sync and Freshness

**User Story:** As a user, I want deal information to be current, so that I don't miss a discount or act on stale data.

#### Acceptance Criteria

1. WHEN a user views a Deal, THE Aggregator SHALL display the time elapsed since the last data refresh.
2. WHEN a product's price changes on the source platform, THE Aggregator SHALL update the Product_Listing within 30 minutes.
3. WHEN a Deal expires or goes out of stock on the source platform, THE Aggregator SHALL mark it as unavailable within 30 minutes.
4. IF a data source becomes unreachable for more than 60 minutes, THEN THE Aggregator SHALL surface a platform-level staleness warning to the user.

---

### Requirement 3: Product Matching Across Platforms

**User Story:** As a user, I want to compare the same product across different platforms, so that I can make the most cost-effective purchase decision.

#### Acceptance Criteria

1. THE Aggregator SHALL identify Matched_Products by comparing product name, brand, model number, and key attributes.
2. WHEN a Matched_Product is found, THE Aggregator SHALL display a side-by-side price comparison across all platforms carrying that product.
3. THE Aggregator SHALL assign a confidence score (0–100) to each product match indicating match reliability.
4. WHEN a match confidence score is below 70, THE Aggregator SHALL label the match as "Unverified" in the UI.
5. THE Aggregator SHALL normalize product attributes (units, variant names) before attempting a match.

---

### Requirement 4: AI Fake Discount Detector and Value Score

**User Story:** As a user, I want to know if a discount is genuine, so that I don't fall for inflated "original prices" designed to mislead.

#### Acceptance Criteria

1. THE Aggregator SHALL compute a Value_Score (0–100) for every Deal using Price_History and category benchmarks.
2. WHEN a product's listed original price exceeds the 90th percentile of its Price_History for the past 90 days, THE Aggregator SHALL flag the deal as a potential Fake_Discount.
3. WHEN a Deal is flagged as a potential Fake_Discount, THE Aggregator SHALL display a visible warning label on the Deal card.
4. THE Aggregator SHALL display the Price_History chart for any Deal so users can evaluate trends themselves.
5. WHEN fewer than 7 days of Price_History exist for a product, THE Aggregator SHALL indicate that the Value_Score has low confidence.

---

### Requirement 5: Smart Card and Bank Offer Optimization

**User Story:** As a user, I want to know which payment method gives me the best final price, so that I can maximize my savings at checkout.

#### Acceptance Criteria

1. THE Aggregator SHALL maintain a database of Bank_Offers per platform, updated at least daily.
2. WHEN a user selects a Deal, THE Aggregator SHALL display all applicable Bank_Offers for that platform.
3. WHEN a user provides their saved payment methods, THE Aggregator SHALL highlight the payment method that yields the lowest effective price.
4. THE Aggregator SHALL compute the effective price as: listed price minus all applicable Bank_Offer discounts and cashback.
5. IF no Bank_Offer applies to a user's saved payment methods, THEN THE Aggregator SHALL suggest the payment method with the best available offer for that deal.

---

### Requirement 6: Payment Redirect and Transparency

**User Story:** As a user, I want to pay through the original platform, so that my transaction and consumer rights are handled by the retailer directly.

#### Acceptance Criteria

1. WHEN a user chooses to buy a product, THE Aggregator SHALL redirect the user to the source platform's product page or checkout flow.
2. THE Aggregator SHALL NOT process or intermediate any payment transaction.
3. WHEN redirecting, THE Aggregator SHALL use deep links where available to land the user on the correct product page.
4. THE Aggregator SHALL display the platform name and logo clearly before any redirect action.

---

### Requirement 7: Combined Ecosystem Cart and Multi-Store Wishlist

**User Story:** As a user, I want to manage a unified cart and wishlist across all platforms, so that I can track and act on multiple deals from one place.

#### Acceptance Criteria

1. THE Aggregator SHALL allow users to add deals from multiple platforms into a single Cart view.
2. WHEN a user views the Cart, THE Aggregator SHALL group items by platform and display the subtotal per platform.
3. THE Aggregator SHALL allow users to add any Product_Listing to a Wishlist.
4. WHEN a Wishlist product drops in price by 5% or more, THE Aggregator SHALL send a notification to the user.
5. WHEN a Wishlist product is detected as a Fake_Discount, THE Aggregator SHALL notify the user with the Value_Score and flag.
6. THE Aggregator SHALL persist Cart and Wishlist data across user sessions.

---

### Requirement 8: Crowdsourced Deal Feed

**User Story:** As a user, I want to discover deals shared by other users, so that I can benefit from community-sourced savings.

#### Acceptance Criteria

1. THE Aggregator SHALL allow authenticated users to submit deals to the Deal_Feed by providing a product URL and optional description.
2. WHEN a deal is submitted, THE Aggregator SHALL validate the URL resolves to a supported platform and extract the current price.
3. WHEN a deal is submitted, THE Aggregator SHALL automatically compute and attach the Value_Score.
4. THE Aggregator SHALL allow users to upvote or downvote deals in the Deal_Feed.
5. WHEN a deal accumulates a vote ratio below 20% positive from at least 10 votes, THE Aggregator SHALL hide the deal from the default feed view.
6. THE Aggregator SHALL display submitted deals with submitter username, submission timestamp, Value_Score, and vote count.

---

### Requirement 9: Buy It For Me Auto-Checkout Bot (Premium)

**User Story:** As a premium user, I want the app to automatically purchase a product for me when it hits a target price, so that I never miss a time-sensitive deal.

#### Acceptance Criteria

1. WHERE the Auto_Checkout_Bot feature is enabled for a premium user, THE Aggregator SHALL allow the user to set a target price and trigger condition for a product.
2. WHEN a product's price drops to or below the user's target price, THE Aggregator SHALL initiate the checkout flow on the user's behalf.
3. THE Aggregator SHALL require explicit user authorization (stored credentials or OAuth token) before any automated purchase.
4. WHEN an auto-checkout attempt is made, THE Aggregator SHALL notify the user with order details and outcome within 5 minutes.
5. IF an auto-checkout attempt fails, THEN THE Aggregator SHALL notify the user immediately with the failure reason and preserve the trigger for retry.
6. THE Aggregator SHALL maintain a full audit log of all Auto_Checkout_Bot actions for each user.
7. WHERE the Auto_Checkout_Bot feature is enabled, THE Aggregator SHALL allow users to pause or cancel any active trigger at any time.

---

### Requirement 10: User Authentication and Profiles

**User Story:** As a user, I want a secure account, so that my preferences, wishlist, cart, and payment methods are saved and private.

#### Acceptance Criteria

1. THE Aggregator SHALL support user registration and login via email/password and OAuth (Google, Apple).
2. WHEN a user registers, THE Aggregator SHALL validate the email format and enforce a minimum password strength of 8 characters with at least one number and one special character.
3. THE Aggregator SHALL store passwords using a secure hashing algorithm (bcrypt or Argon2).
4. WHEN a user is inactive for 30 days, THE Aggregator SHALL require re-authentication on next login.
5. THE Aggregator SHALL allow users to save and manage up to 10 payment method references (tokenized, never raw card data).

---

### Requirement 11: Search and Discovery

**User Story:** As a user, I want to search for products and filter deals, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. THE Aggregator SHALL provide a full-text search over all active Product_Listings.
2. WHEN a user submits a search query, THE Aggregator SHALL return results within 2 seconds.
3. THE Aggregator SHALL allow filtering by platform, discount percentage, Value_Score, category, and price range.
4. THE Aggregator SHALL allow sorting results by discount percentage, Value_Score, price (low to high / high to low), and recency.
5. WHEN a search query matches no results, THE Aggregator SHALL suggest related search terms or trending deals.
