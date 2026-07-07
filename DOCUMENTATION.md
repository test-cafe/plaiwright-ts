# Next Pizza — Technical Documentation

> A full-stack pizza ordering platform built with Next.js 14 App Router, Prisma, and Stripe.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication Flow](#6-authentication-flow)
7. [Cart & Checkout Flow](#7-cart--checkout-flow)
8. [Component Architecture](#8-component-architecture)
9. [State Management](#9-state-management)
10. [API Reference](#10-api-reference)
11. [Server Actions](#11-server-actions)
12. [Services Layer](#12-services-layer)
13. [Environment Variables](#13-environment-variables)
14. [Getting Started](#14-getting-started)
15. [Testing](#15-testing)
16. [Deployment](#16-deployment)

---

## 1. Project Overview

Next Pizza is a production-grade pizza ordering web application. It supports anonymous and authenticated users, real-time cart management, Stripe-powered checkout, OAuth sign-in, admin dashboard, email notifications, and file uploads.

### Key Features

| Feature | Description |
|---|---|
| **Product Catalog** | Category-filtered product listing with ingredient and size customization |
| **Shopping Cart** | Cookie-based anonymous cart that merges on login |
| **Checkout** | Stripe payment sessions with webhook confirmation |
| **Authentication** | Email/password, Google OAuth, GitHub OAuth |
| **Order History** | View past orders with status tracking |
| **Admin Dashboard** | Full CRUD for categories, products, ingredients, and users |
| **Stories** | Instagram-style stories component |
| **File Uploads** | UploadThing-powered image management |
| **Email** | Transactional order emails via Resend |

---

## 2. System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph Client["Browser (Client)"]
        Browser["User Browser"]
    end

    subgraph NextApp["Next.js Application (App Router)"]
        direction TB
        RSC["React Server Components\n(app/**/page.tsx)"]
        RCC["React Client Components\n(components/shared/)"]
        APIRoutes["API Routes\n(app/api/**)"]
        Actions["Server Actions\n(app/actions.ts)"]
        Middleware["Middleware / Auth Guard"]
    end

    subgraph DataLayer["Data Layer"]
        Prisma["Prisma ORM"]
        PG["PostgreSQL"]
    end

    subgraph ExternalServices["External Services"]
        Stripe["Stripe\n(Payments)"]
        Resend["Resend\n(Email)"]
        Google["Google OAuth"]
        GitHub["GitHub OAuth"]
        UploadThing["UploadThing\n(File Storage)"]
    end

    Browser -->|HTTP / WebSocket| NextApp
    RSC --> Prisma
    Actions --> Prisma
    APIRoutes --> Prisma
    Prisma --> PG

    APIRoutes -->|Checkout session| Stripe
    Stripe -->|Webhook callback| APIRoutes
    Actions -->|Send email| Resend
    Middleware -->|Token validation| NextApp
    RCC -->|OAuth redirect| Google
    RCC -->|OAuth redirect| GitHub
    RCC -->|Upload files| UploadThing
```

### Request Lifecycle

```mermaid
sequenceDiagram
    participant B as Browser
    participant M as Middleware
    participant RSC as Server Component
    participant API as API Route
    participant DB as PostgreSQL
    participant Ext as External Service

    B->>M: HTTP Request
    M->>M: Validate session/token
    alt Protected Route
        M-->>B: Redirect /not-auth
    else Public Route
        M->>RSC: Pass request
        RSC->>DB: Prisma query (direct)
        DB-->>RSC: Data
        RSC-->>B: HTML (Server-rendered)
    end

    B->>API: Client fetch / Axios
    API->>DB: Prisma query
    DB-->>API: Data
    API-->>B: JSON response

    B->>Ext: External API call (Stripe)
    Ext-->>B: Response
```

---

## 3. Tech Stack

### Core

| Technology | Version | Role |
|---|---|---|
| [Next.js](https://nextjs.org/) | ^16.2.4 | Full-stack React framework (App Router) |
| [React](https://react.dev/) | ^18 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | ^5.9.3 | Type safety |
| [Prisma](https://www.prisma.io/) | ^5.11.0 | ORM and migrations |
| [PostgreSQL](https://www.postgresql.org/) | Latest | Relational database |

### Authentication

| Technology | Version | Role |
|---|---|---|
| [NextAuth.js](https://next-auth.js.org/) | ^4.24.14 | Session management |
| [bcrypt](https://www.npmjs.com/package/bcrypt) | ^5.1.1 | Password hashing |

### UI & Styling

| Technology | Version | Role |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com/) | ^3.3.0 | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com/) | — | Accessible component system |
| [Radix UI](https://www.radix-ui.com/) | Various | Headless primitives |
| [Lucide React](https://lucide.dev/) | ^0.363.0 | Icon library |
| [class-variance-authority](https://cva.style/) | ^0.7.0 | Component variants |

### Forms & Validation

| Technology | Version | Role |
|---|---|---|
| [React Hook Form](https://react-hook-form.com/) | ^7.51.3 | Form management |
| [Zod](https://zod.dev/) | ^3.22.4 | Schema validation |

### Data Fetching & HTTP

| Technology | Version | Role |
|---|---|---|
| [Axios](https://axios-http.com/) | ^1.6.8 | HTTP client |
| [Zustand](https://zustand-demo.pmnd.rs/) | ^4.5.2 | Client state management |

### Payments & Communications

| Technology | Version | Role |
|---|---|---|
| [Stripe](https://stripe.com/) | ^22.0.2 | Payment processing |
| [Resend](https://resend.com/) | ^3.2.0 | Transactional email |
| [UploadThing](https://uploadthing.com/) | ^6.9.0 | File uploads |

### Testing

| Technology | Version | Role |
|---|---|---|
| [Vitest](https://vitest.dev/) | ^4.1.5 | Unit & integration tests |
| [Playwright](https://playwright.dev/) | ^1.59.1 | End-to-end tests |
| [Testing Library](https://testing-library.com/) | ^16.3.2 | React component tests |
| [Faker.js](https://fakerjs.dev/) | ^10.4.0 | Test data generation |

---

## 4. Project Structure

```
next-pizza-finished/
│
├── app/                            # Next.js App Router
│   ├── (root)/                     # Main route group
│   │   ├── layout.tsx              # Root shell layout
│   │   ├── page.tsx                # Home: product catalog
│   │   ├── not-found.tsx           # 404 page
│   │   ├── not-auth/page.tsx       # Unauthenticated fallback
│   │   ├── profile/page.tsx        # User profile (protected)
│   │   ├── product/[id]/page.tsx   # Product detail page
│   │   └── @modal/                 # Parallel / intercepting modal routes
│   │       └── (.)product/[id]/    # Product modal overlay
│   │
│   ├── (cart)/                     # Cart route group
│   │   ├── layout.tsx
│   │   ├── cart/page.tsx           # Checkout page
│   │   └── orders/page.tsx         # Order history (protected)
│   │
│   ├── api/                        # API Route Handlers
│   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   ├── auth/me/                # Current user
│   │   ├── auth/verify/            # Email verification
│   │   ├── cart/                   # Cart CRUD
│   │   ├── cart/[id]/              # Cart item CRUD
│   │   ├── cart/checkout/callback/ # Stripe webhook
│   │   ├── ingredients/            # Ingredients list
│   │   ├── products/[id]/          # Product by ID
│   │   ├── products/search/        # Product search
│   │   ├── stories/                # Stories list
│   │   └── uploadthing/            # File upload handler
│   │
│   ├── layout.tsx                  # HTML root layout
│   ├── providers.tsx               # Client provider wrappers
│   └── actions.ts                  # Server Actions
│
├── components/
│   ├── ui/                         # Base UI (shadcn/ui components)
│   └── shared/                     # Domain components
│       ├── modals/                 # Modal dialogs
│       ├── dashboard/              # Admin dashboard components
│       ├── form/                   # Reusable form inputs
│       ├── cart-item-details/      # Cart item subcomponents
│       └── skeletons/              # Loading skeletons
│
├── lib/                            # Server-side utilities
│   ├── auth-options.ts             # NextAuth configuration
│   ├── prisma.ts                   # Prisma singleton
│   ├── find-pizzas.ts              # Product filtering logic
│   ├── get-cart-details.ts         # Cart data transformer
│   ├── create-payment.ts           # Stripe session factory
│   ├── send-email.ts               # Resend email helper
│   └── get-user-session.ts         # Server session helper
│
├── services/                       # Client-side API wrappers
│   ├── api-client.ts               # Unified API object
│   ├── instance.ts                 # Axios instance
│   ├── cart.ts                     # Cart API calls
│   ├── products.ts                 # Products API calls
│   ├── ingredients.ts
│   ├── stories.ts
│   ├── auth.ts
│   └── dto/cart.ts                 # Data transfer types
│
├── store/                          # Zustand stores
│   ├── cart.ts                     # Cart global state
│   └── category.ts                 # Active category state
│
├── hooks/                          # Custom React hooks
│   ├── use-cart.ts                 # Cart hook with debounce
│   └── use-choose-pizza.ts         # Pizza selection logic
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Seed script
│
├── tests/
│   ├── e2e/                        # Playwright E2E tests
│   ├── integration/                # Vitest integration tests
│   │   ├── api/                    # API route tests
│   │   └── db/                     # Database layer tests
│   ├── unit/                       # Unit tests
│   ├── factories/                  # Test data factories
│   └── helpers/                    # Test utilities
│
├── @types/                         # TypeScript augmentations
├── public/                         # Static assets
├── next.config.mjs
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## 5. Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User {
        Int id PK
        String fullName
        String email UK
        String password
        UserRole role
        DateTime verified
        String provider
        String providerId
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        Int id PK
        String name
    }

    Product {
        Int id PK
        String name
        String imageUrl
        Int categoryId FK
        DateTime createdAt
        DateTime updatedAt
    }

    ProductItem {
        Int id PK
        Int price
        Int size
        Int pizzaType
        Int productId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Ingredient {
        Int id PK
        String name
        Int price
        String imageUrl
        DateTime createdAt
        DateTime updatedAt
    }

    Cart {
        Int id PK
        Int userId FK
        String tokenId
        Int totalAmount
        DateTime createdAt
        DateTime updatedAt
    }

    CartItem {
        Int id PK
        Int productItemId FK
        Int cartId FK
        Int userId FK
        Int quantity
        Int pizzaSize
        Int type
        DateTime createdAt
        DateTime updatedAt
    }

    Order {
        Int id PK
        Int userId FK
        Json items
        OrderStatus status
        Int totalAmount
        String paymentId
        String fullName
        String address
        String email
        String phone
        String comment
        DateTime createdAt
        DateTime updatedAt
    }

    VerificationCode {
        Int id PK
        Int userId FK
        String code
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    Story {
        Int id PK
        String previewImageUrl
        DateTime createdAt
    }

    StoryItem {
        Int id PK
        Int storyId FK
        String sourceUrl
        DateTime createdAt
    }

    User ||--o{ Order : "places"
    User ||--o| Cart : "has"
    User ||--o{ CartItem : "has"
    User ||--o| VerificationCode : "has"

    Category ||--o{ Product : "contains"
    Product ||--o{ ProductItem : "has variants"
    Product }o--o{ Ingredient : "can include"

    Cart ||--o{ CartItem : "contains"
    CartItem }o--|| ProductItem : "references"
    CartItem }o--o{ Ingredient : "extra ingredients"

    Story ||--o{ StoryItem : "has"
```

### Enums

```mermaid
graph LR
    subgraph OrderStatus
        PENDING
        SUCCEEDED
        CANCELLED
    end

    subgraph UserRole
        USER
        ADMIN
    end
```

### Key Design Decisions

- **Anonymous Cart**: `Cart.tokenId` stores a cookie token for unauthenticated users. On login the cart is merged into the user's account via `Cart.userId`.
- **Pizza Variants**: `ProductItem` holds `size` and `pizzaType` to model all size/crust combinations. `Product` → `ProductItem` is a one-to-many relation.
- **Flexible Ingredients**: Cart items track extra ingredients through a many-to-many join (`CartItem` ↔ `Ingredient`).
- **Order Snapshot**: `Order.items` is stored as JSON to preserve the exact state of the cart at purchase time — immune to future product edits.

---

## 6. Authentication Flow

### Provider Overview

```mermaid
graph TD
    User -->|Email & Password| Credentials["Credentials Provider"]
    User -->|OAuth| Google["Google Provider"]
    User -->|OAuth| GitHub["GitHub Provider"]

    Credentials --> SignInCb["signIn Callback"]
    Google --> SignInCb
    GitHub --> SignInCb

    SignInCb -->|Lookup or create user| DB[(PostgreSQL)]
    SignInCb --> JWTCb["jwt Callback\nEnrich token: id, role"]
    JWTCb --> SessionCb["session Callback\nExpose id & role to client"]
    SessionCb --> Session["JWT Session Cookie"]
```

### Registration & Email Verification

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Register Form
    participant SA as Server Action
    participant DB as PostgreSQL
    participant Email as Resend

    U->>UI: Fill name, email, password
    UI->>SA: registerUser(body)
    SA->>SA: bcrypt.hash(password)
    SA->>DB: prisma.user.create()
    SA->>DB: prisma.verificationCode.create()
    SA->>Email: Send verification email
    Email-->>U: Email with /api/auth/verify?code=...
    U->>U: Click verify link
    U->>DB: GET /api/auth/verify?code=
    DB->>DB: Match code, set user.verified
    DB-->>U: Redirect to home
```

### Session Strategy

NextAuth uses **JWT** sessions (stateless). Token enrichment:

```
JWT Payload = {
  id:       string   // user.id
  email:    string
  name:     string   // user.fullName
  role:     UserRole // USER | ADMIN
  image:    string
}
```

The session is available on the client via `useSession()` and on the server via `getServerSession(authOptions)` (wrapped as `getUserSession()` in `lib/get-user-session.ts`).

---

## 7. Cart & Checkout Flow

### Cart State Machine

```mermaid
stateDiagram-v2
    [*] --> Anonymous: First visit
    Anonymous --> Anonymous: Add items (cookie token)
    Anonymous --> Authenticated: Login / Register
    Authenticated --> Authenticated: Add / update / remove items
    Authenticated --> Checkout: Proceed to cart page
    Checkout --> PaymentPending: Submit order form
    PaymentPending --> Stripe: Redirect to Stripe
    Stripe --> WebhookCallback: Payment complete
    WebhookCallback --> OrderSucceeded: Update order status
    OrderSucceeded --> EmailSent: Send confirmation email
    EmailSent --> [*]
```

### Checkout Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant CartPage as Cart Page
    participant SA as createOrder (Server Action)
    participant DB as PostgreSQL
    participant Stripe as Stripe API
    participant WH as /api/cart/checkout/callback
    participant Email as Resend

    U->>CartPage: Fill delivery form & submit
    CartPage->>SA: createOrder(formData)
    SA->>DB: prisma.order.create({ status: PENDING })
    SA->>DB: prisma.cart.update({ items: [] })
    SA->>Stripe: createPayment(order)
    Stripe-->>SA: { confirmation_url }
    SA-->>CartPage: Redirect to confirmation_url

    U->>Stripe: Complete payment on Stripe
    Stripe->>WH: POST webhook event
    WH->>WH: Verify Stripe signature
    WH->>DB: prisma.order.update({ status: SUCCEEDED })
    WH->>Email: Send order confirmation
    Email-->>U: Confirmation email
    Stripe-->>U: Redirect to success URL
```

### Cart Architecture

```mermaid
graph LR
    subgraph Server
        API_GET["GET /api/cart"]
        API_POST["POST /api/cart"]
        API_PATCH["PATCH /api/cart/:id"]
        API_DEL["DELETE /api/cart/:id"]
        Cookie["cartToken cookie"]
    end

    subgraph Client
        Store["Zustand CartStore"]
        Hook["useCart() hook"]
        Debounce["lodash.debounce\n(quantity updates)"]
        Components["Cart Components"]
    end

    Store --> Hook
    Hook --> Debounce
    Hook --> Components
    Components --> API_POST
    Components --> API_PATCH
    Components --> API_DEL
    API_GET --> Store
    Cookie --> API_GET
```

---

## 8. Component Architecture

### Page Component Tree

```mermaid
graph TD
    Root["RootLayout (app/layout.tsx)"]
    Root --> Providers["Providers\n(SessionProvider, Toaster)"]
    Root --> TopLoader["NextTopLoader"]

    Providers --> HomeLayout["(root)/layout.tsx"]
    HomeLayout --> Header["Header"]
    HomeLayout --> HomePage["Home Page (/)"]

    Header --> SearchInput["SearchInput"]
    Header --> CartButton["CartButton → CartDrawer"]
    Header --> ProfileButton["ProfileButton → AuthModal"]

    HomePage --> TopBar["TopBar (categories + sort)"]
    HomePage --> Filters["Filters (sidebar)"]
    HomePage --> ProductList["ProductsGroupList"]
    HomePage --> Stories["Stories"]

    ProductList --> ProductCard["ProductCard (×N)"]
    ProductCard -->|click| Modal["ChooseProductModal\n(intercepting route)"]
    Modal --> ChoosePizzaForm["ChoosePizzaForm"]
    Modal --> ChooseProductForm["ChooseProductForm"]

    ChoosePizzaForm --> PizzaImage["PizzaImage"]
    ChoosePizzaForm --> GroupVariants["GroupVariants (size/type)"]
    ChoosePizzaForm --> IngredientsList["IngredientsList"]

    Providers --> CartLayout["(cart)/layout.tsx"]
    CartLayout --> CartPage["Cart Page (/cart)"]
    CartPage --> CartSidebar["CartSidebar"]
    CartPage --> FormInput["FormInput (personal info)"]
```

### Shared Component Catalogue

```mermaid
mindmap
  root((components/shared))
    Layout
      Container
      Header
      WhiteBlock
      Title
    Product
      ProductCard
      ProductSkeleton
      ProductsGroupList
      PizzaImage
      IngredientsList
    Cart
      CartButton
      CartDrawer
      CartItem
      DrawerCartItem
      CartSidebar
      CartItemDetails
    Forms
      ChoosePizzaForm
      ChooseProductForm
      GroupVariants
      PizzaSelector
      FormInput
      FormSelect
      FormTextarea
      AddressInput
      ProfileForm
    Filters
      Filters
      CheckboxFiltersGroup
      FilterCheckbox
      SearchInput
      SortPopup
    Auth
      AuthModal
      LoginForm
      RegisterForm
      ProfileButton
    Modals
      ChooseProductModal
      StoryModal
    Orders
      OrderItem
      OrderCartItem
      OrderStatus
    Dashboard
      DashboardFormHeader
      DashboardMenu
      DeleteButton
      CRUD Forms
    Utilities
      Categories
      TopBar
      Pagination
      CountButton
      ClearButton
      ErrorText
```

---

## 9. State Management

### Zustand Stores

```mermaid
graph LR
    subgraph CartStore["useCartStore (store/cart.ts)"]
        direction TB
        S1["loading: boolean"]
        S2["error: boolean"]
        S3["totalAmount: number"]
        S4["items: ICartItem[]"]
        A1["fetchCartItems()"]
        A2["addCartItem(values)"]
        A3["updateItemQuantity(id, qty)"]
        A4["removeCartItem(id)"]
    end

    subgraph CategoryStore["useCategoryStore (store/category.ts)"]
        direction TB
        C1["activeId: number"]
        C2["setActiveId(id)"]
    end

    subgraph Hooks
        useCart["useCart()\n+ debounced updateItemQuantity"]
        useChoosePizza["useChoosePizza(items)\n+ size/type/ingredient state"]
    end

    CartStore --> useCart
    useCart --> Components["Cart Components"]
    CategoryStore --> TopBar["TopBar"]
    useChoosePizza --> ChoosePizzaForm
```

### ICartItem Type

```ts
type ICartItem = {
  id: number;
  quantity: number;
  name: string;
  imageUrl: string;
  price: number;
  pizzaSize?: number | null;
  type?: number | null;
  ingredients: { name: string; price: number }[];
};
```

---

## 10. API Reference

All routes are prefixed with `/api`.

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET/POST` | `/auth/[...nextauth]` | — | NextAuth handler (sign-in, callback, sign-out) |
| `GET` | `/auth/me` | Required | Returns authenticated user data |
| `GET` | `/auth/verify` | — | Verifies email with `?code=<code>` |

### Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products/[id]` | — | Product with `items` and `ingredients` |
| `GET` | `/products/search?query=` | — | Case-insensitive search (max 5 results) |

### Cart

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/cart` | — | Current cart (cookie token or session) |
| `POST` | `/cart` | — | Add item. Body: `CreateCartItemValues` |
| `PATCH` | `/cart/[id]` | — | Update item quantity. Body: `{ quantity: number }` |
| `DELETE` | `/cart` | — | Clear all cart items |
| `DELETE` | `/cart/[id]` | — | Remove a specific cart item |
| `POST` | `/cart/checkout/callback` | Stripe | Stripe webhook — marks order SUCCEEDED |

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/ingredients` | — | All ingredients |
| `GET` | `/stories` | — | All stories with items |
| `GET/POST` | `/uploadthing` | Required | File upload handler |

### Request / Response Types

```ts
// POST /api/cart
interface CreateCartItemValues {
  productItemId: number;
  pizzaSize?: number;
  type?: number;
  ingredientsIds?: number[];
  quantity: number;
}

// GET /api/cart → CartResponse
type CartResponse = Cart & {
  items: CartItemDTO[];
};

type CartItemDTO = CartItem & {
  productItem: ProductItem & {
    product: Product;
    ingredients: Ingredient[];
  };
  ingredients: Ingredient[];
};
```

---

## 11. Server Actions

Defined in [app/actions.ts](app/actions.ts). All mutations use `revalidatePath()` for cache invalidation.

### User Management

| Action | Description |
|---|---|
| `registerUser(body)` | Hash password with bcrypt, create user in DB |
| `updateUserInfo(body)` | Update authenticated user's profile data |

### Order Management

| Action | Description |
|---|---|
| `createOrder(data)` | Create DB order, clear cart, initiate Stripe checkout, redirect |

### Admin Dashboard (ADMIN role required)

| Domain | Actions |
|---|---|
| Users | `createUser`, `updateUser`, `deleteUser` |
| Categories | `createCategory`, `updateCategory`, `deleteCategory` |
| Products | `createProduct`, `updateProduct`, `deleteProduct` |
| Ingredients | `createIngredient`, `updateIngredient`, `deleteIngredient` |
| Product Items | `createProductItem`, `updateProductItem`, `deleteProductItem` |

---

## 12. Services Layer

Client-side HTTP abstraction using Axios.

```mermaid
graph LR
    Components -->|import| ApiClient["Api (services/api-client.ts)"]
    ApiClient --> CartService["cart.ts"]
    ApiClient --> ProductsService["products.ts"]
    ApiClient --> IngredientsService["ingredients.ts"]
    ApiClient --> StoriesService["stories.ts"]
    ApiClient --> AuthService["auth.ts"]

    CartService --> AxiosInstance["Axios instance\n(baseURL: /api)"]
    ProductsService --> AxiosInstance
    IngredientsService --> AxiosInstance
    StoriesService --> AxiosInstance
    AuthService --> AxiosInstance
```

Each service method maps 1-to-1 to its corresponding API route documented in [Section 10 — API Reference](#10-api-reference).

---

## 13. Environment Variables

Create a `.env` file at the project root. All variables marked **Required** must be set before running the app.

```bash
# ── Database ──────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/next-pizza"   # Required

# ── Next.js ───────────────────────────────────────────
NEXT_PUBLIC_API_URL="/api"                                        # Required
NEXTAUTH_URL="http://localhost:3000"                              # Required
NEXTAUTH_SECRET="your-random-secret-here"                         # Required

# ── OAuth Providers ───────────────────────────────────
GITHUB_ID="your-github-oauth-app-id"                             # Required
GITHUB_SECRET="your-github-oauth-app-secret"                     # Required
GOOGLE_CLIENT_ID="your-google-client-id"                         # Required
GOOGLE_CLIENT_SECRET="your-google-client-secret"                 # Required

# ── Payments ──────────────────────────────────────────
STRIPE_SECRET_KEY="sk_test_..."                                   # Required
STRIPE_WEBHOOK_SECRET="whsec_..."                                 # Required (production)

# ── Email ─────────────────────────────────────────────
RESEND_API_KEY="re_..."                                           # Required

# ── File Uploads ──────────────────────────────────────
UPLOADTHING_SECRET="sk_live_..."                                  # Required
UPLOADTHING_APP_ID="your-uploadthing-app-id"                     # Required
```

For tests, create `.env.test` with a separate `DATABASE_URL` pointing to `next_pizza_test`.

---

## 14. Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- npm >= 10

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd next-pizza-finished

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in all required values in .env

# 4. Set up the database
npm run prisma:migrate        # Run migrations
npm run prisma:seed           # Seed with sample data

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:migrate` | Apply pending migrations |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:reset` | Reset and re-seed DB |
| `npm run prisma:generate` | Re-generate Prisma client |

---

## 15. Testing

### Strategy Overview

```mermaid
graph TD
    subgraph "Test Pyramid"
        E2E["E2E Tests\n(Playwright)\n~22 tests"]
        Integration["Integration Tests\n(Vitest + real DB)\nAPI & DB layer"]
        Unit["Unit Tests\n(Vitest + jsdom)\nUtilities & hooks"]
    end

    Unit --> Integration --> E2E
```

### Running Tests

```bash
# Unit & integration tests (uses .env.test)
npm run test               # Run once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# E2E tests (requires running dev server)
npm run test:e2e           # Headless
npm run test:e2e:ui        # Interactive UI mode
```

### Test File Structure

```
tests/
├── e2e/
│   ├── auth.spec.ts           # Sign-in / register flows
│   ├── browse.spec.ts         # Catalog browsing
│   ├── cart.spec.ts           # Cart add / edit / checkout
│   └── pages/                 # Page Object Models (POM)
│
├── integration/
│   ├── api/
│   │   ├── auth.test.ts       # Auth API endpoints
│   │   ├── cart.test.ts       # Cart API endpoints
│   │   ├── cart-item.test.ts  # Cart item CRUD
│   │   ├── ingredients.test.ts
│   │   ├── products.test.ts
│   │   └── stories.test.ts
│   └── db/
│       ├── cart.test.ts       # Cart DB queries
│       ├── order.test.ts      # Order operations
│       ├── product.test.ts    # Product queries
│       └── user.test.ts       # User management
│
├── unit/                      # Pure utility tests
├── factories/index.ts         # Faker-based test factories
└── helpers/
    ├── db.ts                  # Prisma test client, cleanDb()
    └── vitest.setup.ts        # Global setup / teardown
```

### Test Infrastructure

- Integration and unit tests use a **separate test database** (`next_pizza_test`) to avoid touching dev data.
- `cleanDb()` is called before each test suite to ensure isolation.
- Playwright tests auto-start the Next.js dev server via `webServer` config.
- E2E tests retry up to **2 times** in CI.

---

## 16. Deployment

### Production Checklist

```mermaid
graph TD
    A[Set environment variables] --> B[Run prisma migrate deploy]
    B --> C[Run npm run build]
    C --> D[Configure Stripe webhook endpoint]
    D --> E[Verify OAuth redirect URIs]
    E --> F[Set NEXTAUTH_URL to production domain]
    F --> G[npm run start]
```

### Step-by-Step

1. **Database** — Provision a PostgreSQL instance. Set `DATABASE_URL` to the production connection string.
2. **Migrations** — Run `npx prisma migrate deploy` (not `dev`) in CI/CD.
3. **OAuth** — Add your production domain to Google and GitHub OAuth app callback URLs:
   - Google: `https://yourdomain.com/api/auth/callback/google`
   - GitHub: `https://yourdomain.com/api/auth/callback/github`
4. **Stripe Webhook** — Register `https://yourdomain.com/api/cart/checkout/callback` as a webhook endpoint in the Stripe dashboard. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
5. **Build & Start**:
   ```bash
   npm run build
   npm run start
   ```
6. **Recommended Platform**: [Vercel](https://vercel.com) (zero-config Next.js hosting). Add all environment variables in the Vercel project settings.

All environment variables needed in CI/CD are the same ones listed in [Section 13 — Environment Variables](#13-environment-variables). Use a secrets manager (e.g., GitHub Actions secrets, Vercel environment settings) to inject them at build and run time.

---

*Documentation generated for Next Pizza v0.1.0 — Last updated: April 2026*
