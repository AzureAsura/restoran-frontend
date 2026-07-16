# Megatha Resto — Modern Restaurant Management Platform

> A full-stack restaurant management and ordering system built with Next.js, TypeScript, and React. Seamlessly integrates frontend customer experience with backend restaurant operations.

**Frontend Demo:** https://megatha-resto.vercel.app/  
**Backend API:** https://restoran-backend-rosy.vercel.app/

---

## Table of Contents

- [Business Overview](#-business-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [License](#-license)

---

## 💼 Business Overview

Megatha Resto is a comprehensive restaurant management platform designed to streamline operations for restaurant owners and enhance the dining experience for customers.

### Business Goals

- **Customer Engagement**: Provide an intuitive online ordering and reservation system
- **Operational Efficiency**: Centralize menu management, orders, and kitchen operations
- **Revenue Growth**: Enable multiple ordering channels (dine-in, delivery, takeout)
- **Data Insights**: Track customer preferences and sales metrics for business intelligence

### Key Value Propositions

✅ **For Customers**: Easy online ordering, real-time order tracking, personalized recommendations  
✅ **For Restaurant Staff**: Streamlined order management, inventory tracking, kitchen queue optimization  
✅ **For Owners**: Comprehensive analytics, revenue reports, multi-location management  

---

## ✨ Key Features

### Customer-Facing Features

- 🎨 **Modern Menu Browser**: Beautiful, searchable menu with categories, images, and descriptions
- 🛒 **Shopping Cart**: Intuitive cart management with add-ons, special instructions, and quantity control
- 🔐 **Authentication**: User registration and login with JWT tokens
- 📍 **Delivery Address Management**: Save and manage multiple delivery addresses
- 📦 **Order Tracking**: Real-time order status updates (pending → preparing → ready → delivered)
- 💳 **Payment Integration**: Secure payment processing integration
- ⭐ **Ratings & Reviews**: Customer feedback system for menu items and orders
- 📱 **Fully Responsive**: Mobile-first design for seamless experience on all devices

### Restaurant Operations

- 🍳 **Menu Management**: Add, edit, and manage menu items with images, pricing, and availability
- 👥 **Order Queue System**: Real-time kitchen display system (KDS) for order management
- 📊 **Sales Dashboard**: View revenue, best-selling items, and customer statistics
- 🚚 **Delivery Management**: Assign delivery personnel and track order routes
- 💾 **Inventory Tracking**: Monitor ingredient stock levels and receive low-stock alerts
- 📅 **Table Reservations**: Manage dine-in reservations and table assignments

---

## 🏗 Architecture

### System Flow Diagram

```mermaid
flowchart TD
    Customer["👤 Customer"]
    Frontend["🌐 Frontend App\n(Next.js)"]
    API["🔌 Backend API\n(Node.js/Express)"]
    DB["💾 Database\n(PostgreSQL)"]
    Storage["📦 File Storage\n(Images/Media)"]
    
    Kitchen["👨‍🍳 Kitchen Display\n(KDS)"]
    Admin["👨‍💼 Admin Dashboard"]
    
    Customer -->|"Browse, Order, Track"|Frontend
    Frontend -->|"API Requests\n(REST/GraphQL)"|API
    API -->|"Query/Update"|DB
    API -->|"Upload/Download"|Storage
    
    API -->|"Order Updates"|Kitchen
    API -->|"Analytics"|Admin
    Kitchen -->|"Fetch Orders"|API
    Admin -->|"Manage Restaurant"|API
    
    style Customer fill:#e8f4f8,stroke:#0288d1,stroke-width:2px
    style Frontend fill:#81c784,stroke:#388e3c,stroke-width:2px,color:#fff
    style API fill:#ff9800,stroke:#e65100,stroke-width:2px,color:#fff
    style DB fill:#f06292,stroke:#c2185b,stroke-width:2px,color:#fff
    style Kitchen fill:#ba68c8,stroke:#7b1fa2,stroke-width:2px,color:#fff
    style Admin fill:#29b6f6,stroke:#01579b,stroke-width:2px,color:#fff
```

### User Journey & Routes

```mermaid
graph LR
    A["Landing Page\n/"] -->|"Browse"|B["Menu\n/menu"]
    B -->|"Add Items"|C["Cart\n/cart"]
    C -->|"Checkout"|D{"Authenticated?"}
    
    D -->|"No"|E["Login\n/login"]
    D -->|"Yes"|F["Checkout\n/checkout"]
    E -->|"Register\n/register"|G["Profile Setup"]
    G -->|"Back to"|F
    
    F -->|"Place Order"|H["Order Confirmation\n/order-confirmation"]
    H -->|"Track"|I["Order Status\n/orders/:id"]
    
    J["Dashboard\n/dashboard"] -->|"Manage"|K["My Orders\n/dashboard/orders"]
    J -->|"Profile"|L["Settings\n/dashboard/settings"]
    J -->|"History"|M["Order History\n/dashboard/history"]
    
    style A fill:#e3f2fd
    style B fill:#e3f2fd
    style C fill:#fff3e0
    style F fill:#fff3e0
    style I fill:#f3e5f5
    style J fill:#e8f5e9
```

### Data Model & Relationships

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Review : writes
    User ||--o{ Address : has
    
    Menu ||--o{ MenuItem : contains
    MenuItem ||--o{ OrderItem : includes
    MenuItem ||--o{ Review : receives
    MenuItem ||--o{ Addon : has
    
    Order ||--o{ OrderItem : contains
    Order ||--o{ OrderTracking : has
    Order ||--o{ Payment : processes
    
    Restaurant ||--o{ Menu : manages
    Restaurant ||--o{ Order : receives
    Restaurant ||--o{ Staff : employs
    
    Staff ||--o{ OrderAssignment : receives
    
    User {
        string id PK
        string name
        string email UK
        string password_hash
        string phone
        string role
        datetime created_at
        datetime updated_at
    }
    
    Order {
        string id PK
        string user_id FK
        string restaurant_id FK
        string status
        decimal total_amount
        string delivery_address
        datetime created_at
        datetime estimated_delivery
    }
    
    MenuItem {
        string id PK
        string menu_id FK
        string name
        string description
        decimal price
        string image_url
        boolean is_available
        int prep_time
    }
    
    OrderItem {
        string id PK
        string order_id FK
        string menu_item_id FK
        int quantity
        string special_instructions
    }
    
    OrderTracking {
        string id PK
        string order_id FK
        string status
        string notes
        datetime timestamp
    }
    
    Review {
        string id PK
        string user_id FK
        string menu_item_id FK
        int rating
        string comment
        datetime created_at
    }
    
    Payment {
        string id PK
        string order_id FK
        string payment_method
        string status
        decimal amount
        datetime timestamp
    }
    
    Address {
        string id PK
        string user_id FK
        string street
        string city
        string postal_code
        boolean is_default
    }
```

---

## 🛠 Tech Stack

### Frontend Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4+ |
| **State Management** | React Context API / Zustand |
| **HTTP Client** | Axios / Fetch API |
| **UI Components** | Custom + Shadcn/ui |
| **Icons** | React Icons |
| **Form Validation** | React Hook Form + Zod |
| **Image Optimization** | Next.js Image |

### Backend Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js / Fastify |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma / Sequelize |
| **Authentication** | JWT / Auth.js |
| **API Docs** | Swagger/OpenAPI |
| **File Storage** | AWS S3 / Cloudinary |
| **Real-time** | WebSocket / Socket.io |

### Infrastructure

| Aspect | Solution |
|---|---|
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Vercel / Railway / Render |
| **Database** | PostgreSQL (Neon / Railway) |
| **CI/CD** | GitHub Actions / Vercel Deploy |
| **CDN** | Vercel Edge / Cloudflare |
| **Monitoring** | Sentry / LogRocket |

---

## 📁 Project Structure

### Frontend (Next.js App Router)

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Landing page
│   │   ├── menu/
│   │   │   └── page.tsx          # Menu browser
│   │   └── layout.tsx            # Public layout
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Registration
│   │   └── layout.tsx            # Auth layout
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── orders/
│   │   │   ├── page.tsx          # Active orders
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Order details
│   │   ├── history/
│   │   │   └── page.tsx          # Order history
│   │   ├── settings/
│   │   │   └── page.tsx          # Account settings
│   │   └── addresses/
│   │       └── page.tsx          # Saved addresses
│   ├── cart/
│   │   └── page.tsx              # Shopping cart
│   ├── checkout/
│   │   └── page.tsx              # Checkout process
│   ├── api/
│   │   └── auth/
│   │       └── [...]             # Auth routes
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── error.tsx                 # Error boundary
├── components/
│   ├── menu/
│   │   ├── MenuCard.tsx
│   │   ├── MenuGrid.tsx
│   │   └── MenuFilter.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   ├── OrderStatus.tsx
│   │   └── OrderTracking.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useOrders.ts
│   └── ...
├── lib/
│   ├── api.ts                    # API client setup
│   ├── auth.ts                   # Auth utilities
│   ├── constants.ts
│   └── utils.ts                  # Helper functions
└── types/
    ├── index.ts
    ├── api.ts
    └── models.ts
public/
├── images/
├── icons/
└── ...
.env.local                        # Environment variables
next.config.js
package.json
tsconfig.json
tailwind.config.js
```

### Backend Directory Structure

```
📂 restoran-backend/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Order.ts
│   │   ├── MenuItem.ts
│   │   └── ...
│   ├── routes/
│   │   ├── auth.ts               # Authentication endpoints
│   │   ├── menu.ts               # Menu management
│   │   ├── orders.ts             # Order operations
│   │   ├── users.ts              # User profiles
│   │   └── ...
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── orderController.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── authenticate.ts       # JWT verification
│   │   ├── errorHandler.ts
│   │   └── ...
│   ├── services/
│   │   ├── orderService.ts
│   │   ├── menuService.ts
│   │   └── ...
│   ├── database/
│   │   ├── schema.prisma         # Prisma schema
│   │   └── client.ts
│   └── server.ts                 # Express app entry
.env                              # Environment variables
docker-compose.yml
Dockerfile
package.json
tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm/yarn
- **PostgreSQL** database (or use cloud: Neon, Railway, Supabase)
- **Git** for version control

### Frontend Setup

**1. Clone the frontend repository**
```bash
git clone https://github.com/AzureAsura/restoran-frontend.git
cd restoran-frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Create environment variables**
```bash
cp .env.example .env.local
```

**4. Configure `.env.local`**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=your_api_key

# Authentication
NEXT_PUBLIC_AUTH_CALLBACK_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

**5. Start development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Backend Setup

**1. Clone the backend repository**
```bash
git clone https://github.com/AzureAsura/restoran-backend.git
cd restoran-backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Create environment variables**
```bash
cp .env.example .env
```

**4. Configure `.env`**
```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/restoran_db

# Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

**5. Setup database**
```bash
# Create tables and run migrations
npx prisma migrate deploy

# Seed sample data (optional)
npm run seed
```

**6. Start backend server**
```bash
npm run dev
```

Backend API running at [http://localhost:3001](http://localhost:3001)

---

## 🔐 Environment Variables

### Frontend `.env.local`

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=UA-XXXXXXXXX-X

# Image CDN (optional)
NEXT_PUBLIC_IMAGE_URL=https://cdn.example.com
```

### Backend `.env`

```env
# Server
NODE_ENV=development
PORT=3001

# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/restoran_db

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🔌 API Integration

### Frontend → Backend Communication

The frontend communicates with the backend via REST API endpoints:

```typescript
// Example: lib/api.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Core API Endpoints

#### Authentication
```
POST   /api/auth/register        # User registration
POST   /api/auth/login           # User login
POST   /api/auth/logout          # User logout
POST   /api/auth/refresh         # Refresh JWT token
GET    /api/auth/me              # Get current user
```

#### Menu & Items
```
GET    /api/menu                 # Get all menu items
GET    /api/menu/:id             # Get menu item details
POST   /api/menu                 # Create menu item (admin)
PUT    /api/menu/:id             # Update menu item (admin)
DELETE /api/menu/:id             # Delete menu item (admin)
```

#### Orders
```
POST   /api/orders               # Create new order
GET    /api/orders               # Get user's orders
GET    /api/orders/:id           # Get order details
PUT    /api/orders/:id           # Update order status
GET    /api/orders/:id/track     # Track order in real-time
```

#### Users
```
GET    /api/users/profile        # Get user profile
PUT    /api/users/profile        # Update profile
GET    /api/users/addresses      # Get saved addresses
POST   /api/users/addresses      # Add new address
DELETE /api/users/addresses/:id  # Delete address
```

### Request/Response Example

**Request:**
```javascript
// POST /api/orders - Create order
const response = await apiClient.post('/api/orders', {
  items: [
    { menuItemId: '123', quantity: 2, specialInstructions: 'No onions' },
    { menuItemId: '456', quantity: 1 }
  ],
  deliveryAddressId: 'addr-789',
  paymentMethod: 'credit_card',
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order-12345",
    "status": "pending",
    "totalAmount": 45.99,
    "estimatedDelivery": "2026-07-16T14:30:00Z",
    "items": [...]
  }
}
```

---

## ⚙️ Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Select GitHub repository
   - Configure environment variables
   - Click "Deploy"

3. **Production Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://api.megatha-resto.com
   ```

### Backend Deployment (Railway/Render)

1. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Create new project → Select GitHub repo
   - Add PostgreSQL plugin
   - Set environment variables
   - Deploy

2. **Alternative: Docker Deployment**
   ```bash
   docker build -t restoran-backend .
   docker run -p 3001:3001 --env-file .env restoran-backend
   ```

### Database Setup (Production)

Use managed PostgreSQL services:
- **Neon** (https://neon.tech) — Serverless Postgres
- **Railway** (https://railway.app) — Integrated DB + hosting
- **Render** (https://render.com) — PostgreSQL managed service

---

## 📊 Monitoring & Analytics

- **Sentry**: Error tracking and debugging
- **LogRocket**: Session replay and frontend analytics
- **Vercel Analytics**: Performance metrics
- **Database Logs**: Query monitoring via Prisma or DB provider

---

## 🔐 Security Best Practices

✅ **Authentication**: JWT tokens with secure refresh mechanism  
✅ **HTTPS**: All connections encrypted (automatic on Vercel)  
✅ **CORS**: Configured to allow only trusted origins  
✅ **Input Validation**: Server-side validation with Zod  
✅ **Password Hashing**: bcrypt for password storage  
✅ **Rate Limiting**: API rate limiting to prevent abuse  
✅ **Environment Variables**: Sensitive data in `.env` files  

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📞 Support & Contact

For questions or support, please reach out to the development team or open an issue in the GitHub repository.

**Frontend Repo:** https://github.com/AzureAsura/restoran-frontend  
**Backend Repo:** https://github.com/AzureAsura/restoran-backend
