# BiteDash — Entity-Relationship Diagram

Generated from `backend/prisma/schema.prisma` (the source of truth — this file documents it,
it doesn't drive migrations). Twelve business tables plus two auth tables (`users`,
`refresh_tokens`) added in Phase 2, linked to the business tables via nullable foreign keys so
an auth identity is separate from — but connected to — its business profile.

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "linked profile"
    USERS ||--o| RESTAURANTS : owns
    USERS ||--o| DELIVERY_AGENTS : "linked profile"
    USERS ||--o{ REFRESH_TOKENS : issues

    CUSTOMERS ||--o{ ADDRESSES : has
    CUSTOMERS ||--o{ ORDERS : places
    CUSTOMERS ||--o{ REVIEWS : writes

    RESTAURANTS ||--o{ MENU_ITEMS : offers
    RESTAURANTS ||--o{ RESTAURANT_CATEGORIES : "tagged with"
    RESTAURANTS ||--o{ REVIEWS : receives

    FOOD_CATEGORIES ||--o{ MENU_ITEMS : categorizes
    FOOD_CATEGORIES ||--o{ RESTAURANT_CATEGORIES : tags

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ PAYMENTS : "paid via"
    ORDERS ||--o{ DELIVERIES : "fulfilled by"

    MENU_ITEMS ||--o{ ORDER_ITEMS : "ordered as"

    DELIVERY_AGENTS ||--o{ DELIVERIES : assigned

    USERS {
        int user_id PK
        string email
        string password_hash
        enum role "customer | restaurant_owner | delivery_agent | admin"
    }
    REFRESH_TOKENS {
        int token_id PK
        int user_id FK
        string token_hash
        datetime expires_at
        datetime revoked_at
    }
    CUSTOMERS {
        int customer_id PK
        int user_id FK
        string name
        string email
        string phone
    }
    ADDRESSES {
        int address_id PK
        int customer_id FK
        string street
        string city
        string zip_code
        string label
    }
    RESTAURANTS {
        int restaurant_id PK
        int owner_user_id FK
        string name
        string email
        string phone
        string address
    }
    FOOD_CATEGORIES {
        int category_id PK
        string category_name
    }
    RESTAURANT_CATEGORIES {
        int restaurant_id PK,FK
        int category_id PK,FK
    }
    MENU_ITEMS {
        int item_id PK
        int restaurant_id FK
        int category_id FK
        string item_name
        string description
        decimal price
        boolean availability
    }
    DELIVERY_AGENTS {
        int agent_id PK
        int user_id FK
        string name
        string phone
        string vehicle_number
    }
    ORDERS {
        int order_id PK
        int customer_id FK
        date order_date
        string status "placed|accepted|preparing|out_for_delivery|delivered|cancelled"
        decimal total_amount
    }
    ORDER_ITEMS {
        int order_item_id PK
        int order_id FK
        int item_id FK
        int quantity
        decimal price "price at time of order"
    }
    PAYMENTS {
        int payment_id PK
        int order_id FK
        decimal amount
        string payment_method
        string payment_status
        string stripe_payment_intent_id
    }
    DELIVERIES {
        int delivery_id PK
        int order_id FK
        int agent_id FK
        string delivery_status "assigned|picked_up|in_transit|delivered|failed"
        time delivery_time
    }
    REVIEWS {
        int review_id PK
        int customer_id FK
        int restaurant_id FK
        int rating "1-5"
        string comment
    }
```

## Notable design decisions

- **`restaurant_categories`** is a many-to-many junction table with a composite primary key
  (`restaurant_id`, `category_id`) — no surrogate key, since the pair itself is the identity.
- **`order_items.price`** is copied from `menu_items.price` at the time of the order, not
  looked up live — so a later menu price change never rewrites the price on a past order.
- **Auth is layered on top of, not merged into, the business schema.** `customers`,
  `restaurants`, and `delivery_agents` each existed before auth did (Phase 1); Phase 2 added
  `users`/`refresh_tokens` and a nullable one-to-one FK from each business table back to
  `users`, rather than folding email/password fields directly into those tables. This keeps
  "who can log in" cleanly separate from "who is a customer/restaurant/agent."
