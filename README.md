# AgriHub Mobile App

AgriHub is a full-stack **agriculture marketplace mobile application** built with **Expo (React Native)** and a **FastAPI backend**.  
It enables buyers to browse and order agricultural products directly from farmers, while farmers can list products, manage orders, and view order status. Admins can approve products and view platform analytics.

This repo contains the **mobile frontend and backend** for AgriHub.

---

## Features

### User Roles

- **Buyer**
  - Browse products
  - Add to cart & checkout
  - View past orders
  - Order tracking

- **Farmer**
  - Add / edit / delete products
  - View incoming orders
  - Confirm orders

- **Admin**
  - Approve pending products
  - Dashboard with analytics

### Core Capabilities

- Role-based authentication (JWT)
- Persistent token storage
- Cart management
- Order creation & lifecycle
- Mock payment simulation
- Push-style notifications
- Error & loading states
- Clean UI with mobile-first design

---


## Tech Stack (Frontend)

- Expo SDK
- React Native + TypeScript
- AsyncStorage for token storage
- Fetch API for backend communication
- MobX/ Zustand/ any state store (if used)
- QR Code support for app installation

---

##  API Integration

The app connects to a FastAPI backend (hosted publicly or locally) for authentication, products, cart, orders, and admin endpoints.

