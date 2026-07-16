# Product Requirements Document (PRD)
# Megatha Kitchen Frontend — Next.js Client untuk Restaurant Booking & Operations System

**Version:** 2.1
**Date:** 8 Juli 2026
**Status:** Final
**Author:** Technical Lead — Megatha Tech
**Target Release:** 1 Month (4 Sprints)
**Team:** 3 Developers (Frontend, Backend, AI Specialist)
**Client:** Single Restaurant (MVP), Multi-tenant ready architecture

> **Catatan versi:** Dokumen ini adalah pecahan dari PRD fullstack Next.js v1.0. Frontend ini murni
> presentation layer + client-side interaction — semua logika bisnis, database, auth backend, dan AI
> berada di project terpisah (lihat `backend/backend.md`). Frontend mengonsumsi Express API via REST —
> semua update "live" (kitchen, cashier, booking) memakai **polling** (TanStack Query `refetchInterval`),
> backend tidak menyediakan WebSocket/realtime push (lihat §9 di `backend/backend.md`).

---

## 1. Executive Summary

### 1.1 Product Vision
Megatha Kitchen adalah sistem manajemen restoran berbasis web dengan AI Concierge yang mengotomatisasi booking, meja assignment, dan customer service. Frontend ini adalah satu-satunya permukaan yang dilihat customer dan staff — landing page, booking, chat, serta dashboard operasional (POS, kitchen, analytics).

**Bukan food delivery app.** Bukan e-commerce. Fokus: **dine-in reservation + in-house operations**.

### 1.2 Peran Frontend dalam Arsitektur
- Merender seluruh UI (customer-facing + admin) sebagai **Next.js App Router**, **fully SSR** untuk initial load.
- Melakukan fetch/mutation interaktif di client via **TanStack Query**, dengan data awal di-hydrate dari SSR (tanpa refetch ganda).
- Polling berkala (TanStack Query `refetchInterval`) untuk update kitchen queue, cashier dashboard, booking calendar — backend tidak punya WebSocket/realtime push.
- Menangani sesi staff via **better-auth client**, membaca session cookie yang diterbitkan backend Express (cross-origin).
- Tidak menyimpan data sendiri — semua state persist di backend; frontend murni render + cache client (TanStack Query).

### 1.3 Scope Boundaries (In vs Out)

| In Scope | Out of Scope (Post-MVP) |
|----------|------------------------|
| Landing page + booking form (SSR) | Pre-order menu saat booking |
| AI Concierge chat widget (client) | Checkout page / payment gateway UI |
| Public menu page (SSR + client filter) | WhatsApp integration (OTP/notif) |
| Admin dashboard: bookings, tables, POS, kitchen, menu, analytics | Multi-branch switcher UI |
| Role-based admin layout/sidebar | Inventory / supplier management UI |
| Kitchen display & cashier sync (polling) | Delivery / takeaway module UI |
| Booking confirmation + ICS calendar export | Loyalty points / membership UI |
| | Review / rating system UI |

---

## 2. Problem Statement & Solution (Perspektif Frontend)

### 2.1 Pain Points yang Diselesaikan di Layer UI
1. **Double Booking terlihat oleh staff terlambat** → Booking calendar & meja floor plan update berkala via polling (TanStack Query `refetchInterval`) supaya staff lihat status terbaru tanpa perlu refresh manual.
2. **Customer bingung cara booking** → Form booking simpel (SSR, fast FCP) + AI chat widget sebagai alternatif conversational.
3. **Kitchen sulit baca kertas** → Kitchen display full-screen, touch-friendly, high contrast, auto-update via polling interval pendek (3-5 detik).
4. **Kasir butuh input cepat** → POS UI keyboard-friendly, optimistic update (TanStack Query mutation) supaya terasa instan.
5. **Owner tidak punya visibilitas data** → Dashboard analytics dengan chart (Recharts), SSR untuk render awal cepat.

---

## 3. Target Users & Personas

### 3.1 Customer (Guest)
- **Goal**: Cepat booking meja tanpa ribet, tanya menu/rekomendasi sebelum datang.
- **Device**: Mobile-first.
- **Auth**: Tidak perlu login — identifikasi via nomor HP saat submit booking.

### 3.2 Cashier
- **Goal**: Input order cepat, lihat booking hari ini, print bill.
- **Device**: Tablet/desktop kasir.
- **Auth**: Login staff (better-auth), role `cashier`.

### 3.3 Kitchen Staff
- **Goal**: Lihat order masuk, update status, prioritaskan.
- **Device**: Tablet/TV kitchen, dilihat dari jarak ±2 meter.
- **Auth**: Login staff, role `kitchen`.

### 3.4 Owner
- **Goal**: Monitor performa restoran via dashboard.
- **Device**: Desktop, occasional mobile check.
- **Auth**: Login staff, role `owner` — akses semua halaman admin.

---

## 4. Technical Architecture

### 4.1 Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 (App Router) | Routing, SSR, layouts, middleware |
| Language | TypeScript | Type safety |
| UI Library | React 19 | Component model |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI Components | shadcn/ui | Accessible, customizable component primitives |
| Animation | Framer Motion | Page transitions, chat bubble, status update animation |
| Charts | Recharts | Dashboard analytics visualisasi |
| Toast | Sonner | Notifikasi sukses/error |
| Data Fetching (client) | **TanStack Query** | Cache, mutation, invalidation, optimistic update, **polling** (`refetchInterval`) |
| Data Fetching (server) | Native `fetch` di Server Component | SSR initial data |
| Auth | **better-auth client** (`@better-auth/client` / React hooks) | Session staff, role-based route guard |
| Deploy | Vercel | Hosting, CI/CD, edge network |

Backend yang dikonsumsi: Express API (lihat `backend/backend.md`) di domain terpisah (mis. `api.megathakitchen.app`), dipanggil dengan `credentials: 'include'` untuk session cookie better-auth cross-origin.

### 4.2 Prinsip Rendering — Fully SSR + TanStack Query Hydration

Pendekatan: **Server Component fetch data awal (SSR) → hydrate ke TanStack Query cache → Client Component lanjutkan interaksi dari cache yang sudah hangat**, tanpa request duplikat saat halaman pertama kali dibuka.

Pola standar per halaman data-driven:

```tsx
// app/menu/page.tsx (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { menuQueryOptions } from '@/lib/queries/menu'
import { MenuList } from './menu-list' // Client Component

export default async function MenuPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(menuQueryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MenuList />
    </HydrationBoundary>
  )
}
```

```tsx
// app/menu/menu-list.tsx (Client Component)
'use client'
import { useQuery } from '@tanstack/react-query'
import { menuQueryOptions } from '@/lib/queries/menu'

export function MenuList() {
  const { data } = useQuery(menuQueryOptions()) // langsung dapat data dari hydration, tanpa refetch
  // filter/search state lokal, mutation lain tetap lewat TanStack Query
}
```

Aturan penerapan:
- **Setiap route halaman** (page.tsx) adalah Server Component yang melakukan `prefetchQuery` untuk data utama halaman tsb, lalu bungkus children dengan `HydrationBoundary`.
- **Semua interaksi setelahnya** (filter, form submit, mutation, update berkala) terjadi di Client Component via TanStack Query — tidak ada `useEffect` + `fetch` manual.
- **Update berkala**: pasang `refetchInterval` (mis. 3-5 detik untuk kitchen, 10-15 detik untuk booking/cashier) pada query yang butuh terasa "live" — ini satu-satunya mekanisme update, bukan fallback (backend tidak punya WebSocket, lihat §9 di PRD backend).
- Query client singleton di server dibuat per-request (`getQueryClient()` dengan `cache()` dari React) supaya tidak bocor antar request SSR.

### 4.3 Auth di Frontend (better-auth client)

- Admin routes (`/admin/*`) diproteksi via **Next.js middleware** (`middleware.ts`): cek session better-auth (call `GET /api/auth/session` ke backend atau baca cookie) sebelum render; redirect ke `/login` kalau tidak ada sesi.
- Role-based rendering: sidebar & guard halaman baca `session.user.role` (`owner`/`cashier`/`kitchen`) untuk tampilkan menu yang relevan dan blok akses halaman di luar role (mis. kitchen tidak bisa buka `/admin/pos`).
- Login page (`/login`) pakai better-auth client hook (`signIn.email`) → cookie session di-set oleh backend (cross-origin, `credentials: include`).
- Server Component yang butuh data admin ikut kirim cookie saat `fetch` ke backend (Next.js meneruskan cookie request masuk saat fetch server-side ke API eksternal).

### 4.4 System Architecture Diagram

```
┌──────────────────────────────────────────────┐
│              Customer (Mobile/Web)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Landing │ │  Booking │ │  AI Chat     │  │
│  │  Page    │ │  Form    │ │  Widget      │  │
│  └──────────┘ └──────────┘ └──────────────┘  │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│         Next.js Frontend (Vercel)             │
│  ┌─────────────────────────────────────────┐  │
│  │  Public Routes (No Auth)                  │  │
│  │  ├─ / (Landing) — SSR                     │  │
│  │  ├─ /menu (Public Menu) — SSR + hydrate   │  │
│  │  └─ /booking (Booking Form) — SSR         │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  Admin Routes (middleware guard)          │  │
│  │  ├─ /admin/dashboard                      │  │
│  │  ├─ /admin/bookings (Calendar)            │  │
│  │  ├─ /admin/tables (Meja Mgmt)             │  │
│  │  ├─ /admin/pos (Cashier)                  │  │
│  │  ├─ /admin/kitchen (Kitchen Display)      │  │
│  │  ├─ /admin/menu (Menu CRUD)               │  │
│  │  └─ /admin/settings                       │  │
│  └─────────────────────────────────────────┘  │
│  Client layer: TanStack Query (polling refetchInterval) │
│  Auth layer: better-auth client                  │
└──────────────────────────────────────────────┘
              │ REST (fetch/TanStack Query)
              ▼
┌──────────────────────────────────────────────┐
│    Express API (Vercel Functions) — lihat backend.md │
└──────────────────────────────────────────────┘
```

---

## 5. Route Structure (App Router)

```
app/
├─ (public)/
│  ├─ page.tsx                    # Landing (/)
│  ├─ menu/page.tsx                # Public menu (/menu)
│  └─ booking/page.tsx             # Booking form (/booking)
├─ login/page.tsx                 # Staff login
├─ admin/
│  ├─ layout.tsx                   # Sidebar + role guard + topbar
│  ├─ dashboard/page.tsx           # Analytics (owner)
│  ├─ bookings/page.tsx            # Booking calendar (owner, cashier)
│  ├─ tables/page.tsx              # Meja management (owner, cashier)
│  ├─ pos/page.tsx                 # Cashier POS (owner, cashier)
│  ├─ kitchen/page.tsx             # Kitchen display, no sidebar (owner, kitchen)
│  ├─ menu/page.tsx                # Menu CRUD (owner)
│  └─ settings/page.tsx            # Restaurant settings (owner)
├─ middleware.ts                   # Auth + role guard untuk /admin/*
lib/
├─ query-client.ts                 # getQueryClient() singleton per-request
├─ api-client.ts                   # fetch wrapper ke Express API (base URL, credentials)
├─ auth-client.ts                  # better-auth client instance
└─ queries/                        # queryOptions per domain (menu, bookings, tables, orders, ...)
```

---

## 6. Halaman & Komponen — Functional Requirements

### 6.1 Customer-Facing

#### FR-CUST-01: Landing Page (`/`)
- **Description**: Hero (foto restoran, nama, tagline, CTA "Booking Sekarang" + "Lihat Menu"), info cards (jam operasional, alamat, telepon), footer.
- **Rendering**: Fully SSR — data restoran (`opening_hours`, dll.) di-fetch server-side, jarang berubah sehingga bisa pakai `revalidate` (ISR ringan) atau fetch langsung tiap request.
- **Priority**: P0

#### FR-CUST-02: Booking Form (`/booking`)
- **Description**: Form: nama, nomor HP (wajib), jumlah orang (1-20), tanggal (date picker), waktu (30-menit slot), preferensi area (radio indoor/outdoor/no preference), catatan khusus (opsional).
- **Validation**: Client-side (Zod + react-hook-form) sebelum submit — format HP Indonesia, tanggal tidak boleh masa lalu, jam dalam jam operasional. Server (Express) tetap validasi ulang.
- **Data flow**: Server Component render form shell (SSR) → submit via TanStack Query `useMutation` ke `POST /bookings` (backend) → sukses tampilkan confirmation card.
- **Priority**: P0

#### FR-CUST-03: AI Chat Widget
- **Description**: Floating chat widget pojok kanan bawah (Client Component, mounted global di root layout). Expand ke chat window.
- **Capabilities**: cek availability, rekomendasi menu, dietary filter, FAQ, booking via chat.
- **Data flow**: Setiap pesan → `useMutation` ke `POST /ai/chat` (backend). Riwayat percakapan disimpan di state lokal (tidak perlu TanStack Query cache karena bersifat transient per sesi).
- **UI**: Suggested chips ("Cek availability", "Rekomendasi menu", "FAQ"), typing indicator (Framer Motion), messages bubble (user kanan, AI kiri).
- **Priority**: P0

#### FR-CUST-04: Booking Confirmation
- **Description**: Setelah submit booking (form atau chat) sukses, tampilkan confirmation card: kode booking, nama, tanggal & waktu, jumlah orang, meja assigned, area, catatan. Tombol "Tambah ke Kalender" (generate & download file `.ics` di client, tanpa perlu backend).
- **Priority**: P0

#### FR-CUST-05: Menu Display (`/menu`)
- **Description**: Tabs kategori (Makanan, Minuman, Dessert). Grid card (foto, nama, harga, deskripsi, tag badge). Filter by category (client-side, dari cache TanStack Query) & search by name.
- **Rendering**: Server Component prefetch `GET /menu` → hydrate → Client Component handle filter/search tanpa refetch ke server (filter di memory dari data yang sudah di-cache).
- **Priority**: P1

### 6.2 Admin — Layout & Navigasi

#### Admin Layout (`app/admin/layout.tsx`)
- Sidebar: Dashboard, Bookings, Tables, POS, Kitchen, Menu, Settings — item yang tampil disesuaikan `session.user.role`.
- Top bar: nama restoran, profile staff, tombol logout (better-auth `signOut`).
- Guard: middleware cek session sebelum render; role check tambahan di layout untuk sembunyikan menu yang tidak relevan (Kitchen hanya lihat "Kitchen", Cashier lihat "POS + Bookings", Owner lihat semua).

### 6.3 Booking Calendar (`/admin/bookings`)

#### FR-ADM-01: Booking Calendar
- **Description**: Date picker (default hari ini), view toggle List/Timeline. List: kolom Waktu, Nama, HP, Jumlah, Meja, Area, Status, Aksi. Status badge berwarna (confirmed biru, seated hijau, completed abu, no-show merah, cancelled abu-strikethrough). Search by nama/HP, filter by status & area.
- **Data flow**: SSR prefetch `GET /admin/bookings?date=today`, hydrate. Perubahan filter/date via `useQuery` dengan query key dinamis (`['bookings', date, status, area]`). Aksi (Edit, Cancel, Mark Seated, Mark No-Show) via `useMutation` ke `PATCH /admin/bookings/:id` dengan optimistic update.
- **Update berkala**: `refetchInterval` (mis. 10-15 detik) pada query `['bookings', date, status, area]` — booking baru/status berubah otomatis muncul di poll berikutnya, tanpa event push.
- **Priority**: P0

### 6.4 Meja Management (`/admin/tables`)

#### FR-ADM-02: Meja Management
- **Description**: Visual grid card per meja (nama, area, kapasitas, status warna: available hijau, reserved kuning, occupied merah, maintenance abu). Click meja → popup detail + booking history. Edit via modal form.
- **Data flow**: SSR prefetch `GET /admin/tables`, hydrate. CRUD via `useMutation` → invalidate `['tables']`.
- **Update berkala**: `refetchInterval` pada query `['tables']` (mis. 10-15 detik).
- **Priority**: P0

### 6.5 POS (`/admin/pos`)

#### FR-POS-01/02/03: Cashier POS
- **Description**: Layout 3 panel — kiri: list meja (occupied + available, klik untuk pilih), tengah: grid menu (tabs kategori, item card, klik untuk tambah ke order), kanan: ringkasan order (items, qty, notes, subtotal, tax, total) + tombol "Kirim ke Kitchen".
- **Data flow**: `useQuery` untuk `GET /admin/tables` dan `GET /menu` (bisa share cache dengan halaman lain). Order draft disimpan di local/client state (Zustand ringan atau `useState`, bukan server state) sampai submit. Submit → `useMutation` ke `POST /admin/orders` → invalidate `['orders']`, `['tables']`.
- **UX**: keyboard shortcut (angka untuk qty, Enter untuk submit), toast (Sonner) konfirmasi order terkirim.
- **Priority**: P0

### 6.6 Kitchen Display (`/admin/kitchen`)

#### FR-KIT-01/02/03: Kitchen Queue
- **Description**: Full-screen, tanpa sidebar. Card besar per order: nomor order, meja, waktu masuk (timer elapsed), items + notes, tombol status besar & touch-friendly (Pending abu → Cooking oranye → Ready hijau → Served biru). Sort FIFO. Click card untuk detail.
- **Data flow**: SSR prefetch `GET /admin/kitchen-queue`, hydrate. Selanjutnya polling `refetchInterval: 3000-5000` sebagai satu-satunya mekanisme update (tidak ada WebSocket/event push).
- **Status update**: `useMutation` ke `PATCH /admin/order-items/:id` dengan optimistic update (langsung ubah warna tombol sebelum response backend datang, rollback kalau gagal).
- **UX**: sound notification (opsional) saat event `order:created` diterima.
- **Priority**: P0

### 6.7 Menu CRUD (`/admin/menu`)

#### FR-MENU-01/02: Menu Management
- **Description**: Table menu items (thumbnail, nama, harga, kategori, status, tags). Modal Add/Edit dengan image upload (file di-submit ke backend sebagai `multipart/form-data`, backend yang handle upload ke Cloudinary — frontend tidak bicara langsung ke Cloudinary). Toggle status available/out_of_stock.
- **Data flow**: SSR prefetch `GET /menu` (atau endpoint admin khusus kalau perlu field tambahan), CRUD via `useMutation` → invalidate `['menu']`.
- **Priority**: P0/P1

### 6.8 Dashboard Analytics (`/admin/dashboard`)

#### FR-DASH-01/02/03: Analytics
- **Description**: Stat cards (Total Booking Hari Ini, Walk-in, Revenue, Occupancy Rate, No-Show). Chart booking per jam (Recharts bar chart, 08:00-22:00). Table top 5 menu. Quick action links ke halaman lain.
- **Data flow**: SSR prefetch `GET /admin/analytics`, `GET /admin/analytics/timeline`, `GET /admin/analytics/menu-performance` (parallel prefetch di Server Component), hydrate sekaligus. Client re-fetch saat ganti tanggal via date picker.
- **Priority**: P1

---

## 7. Kontrak API (Ringkasan — detail lihat `backend/backend.md`)

- **Base URL**: env `NEXT_PUBLIC_API_URL` (mis. `https://api.megathakitchen.app`).
- **Response shape**: `{ success: boolean, data?: T, error?: { code, message } }`.
- **Fetch wrapper** (`lib/api-client.ts`): set `credentials: 'include'` (kirim cookie session cross-origin), parse error shape, lempar exception yang ditangkap TanStack Query (`onError` → toast Sonner).
- **Auth endpoints**: dikonsumsi via better-auth client, base URL sama dengan API.
- **Update berkala**: tidak ada koneksi realtime terpisah — semua "live update" murni polling ulang endpoint REST yang sama. Lihat §9 di `backend/backend.md` untuk endpoint & interval yang disarankan.

---

## 8. Non-Functional Requirements

### 8.1 Performance (NFR-PERF)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | First Contentful Paint (FCP) | < 1.5 detik |
| NFR-PERF-02 | Time to Interactive (TTI) | < 3.5 detik |
| NFR-PERF-03 | Lighthouse Performance Score | > 85 |
| NFR-PERF-04 | Bundle size (JS) | < 300 KB initial |
| NFR-PERF-05 | Kitchen display data freshness (interval polling) | ≤ 5 detik |
| NFR-PERF-06 | Tidak ada duplicate fetch antara SSR prefetch dan client mount (hydration harus match) | Mandatory |

### 8.2 Security (NFR-SEC)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC-01 | Admin routes diproteksi middleware — tidak render konten sensitif sebelum session tervalidasi. | Mandatory |
| NFR-SEC-02 | Customer HP tidak pernah dirender di halaman publik. | Mandatory |
| NFR-SEC-03 | Input sanitization di form & chat (XSS prevention) sebelum dikirim ke backend. | Mandatory |
| NFR-SEC-04 | Cookie session better-auth diperlakukan `httpOnly` (tidak diakses via JS) — frontend hanya mengandalkan header `Set-Cookie` dari backend. | Mandatory |
| NFR-SEC-05 | Tidak ada secret (API key) yang bocor ke bundle client — hanya `NEXT_PUBLIC_*` yang publik. | Mandatory |

### 8.3 Reliability (NFR-REL)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | Uptime target | 99% (Vercel) |
| NFR-REL-02 | TanStack Query retry otomatis kalau polling request gagal (built-in retry policy, tidak ada koneksi WebSocket yang perlu di-reconnect). | Mandatory |
| NFR-REL-03 | AI chat fallback UI: kalau `POST /ai/chat` gagal/timeout, tampilkan pesan "Silakan hubungi kami di [nomor]". | Mandatory |
| NFR-REL-04 | Booking form tetap bisa submit walau AI chat down (form adalah jalur independen). | Mandatory |

### 8.4 Usability (NFR-UX)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-UX-01 | Responsive: mobile (customer), tablet (cashier), desktop/TV (kitchen). | Mandatory |
| NFR-UX-02 | Kitchen display: touch-friendly, large buttons, high contrast, readable dari 2 meter. | Mandatory |
| NFR-UX-03 | Cashier POS: keyboard-friendly (shortcut keys), fast input, optimistic UI feedback. | Mandatory |
| NFR-UX-04 | Chat widget: mobile-optimized, tidak block content, animasi halus (Framer Motion) tapi tidak mengganggu performa. | Mandatory |

---

## 9. Success Criteria & KPIs

| Criteria | Target | Measurement |
|----------|--------|-------------|
| FCP | <1.5s | Lighthouse |
| TTI | <3.5s | Lighthouse |
| Lighthouse Score | >85 | Lighthouse |
| Kitchen display data freshness | ≤5s | Manual + polling interval test |
| Booking conversion rate | >60% | booking submitted / booking page visit |
| AI handle inquiry tanpa human intervention | >70% | chat session log |
| Zero hydration mismatch error | 100% | Manual QA + Next.js console check |

---

## 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hydration mismatch antara SSR prefetch dan client TanStack Query | Medium | Medium | Pastikan query key & serialisasi data konsisten; gunakan `dehydrate`/`HydrationBoundary` sesuai pola resmi TanStack Query untuk Next.js App Router. |
| Cross-origin cookie better-auth tidak terkirim (browser privacy setting) | Medium | High | Set `sameSite=none; secure` di backend, uji di Safari/iOS, siapkan pesan error jelas kalau sesi gagal terbaca. |
| Polling terlalu sering membebani cost serverless (backend di Vercel Functions) | Low | Medium | Interval wajar per konteks (3-5s kitchen, 10-15s lainnya), `refetchIntervalInBackground: false` biar berhenti saat tab tidak aktif. |
| Scope creep UI (fitur di luar MVP) | High | High | Strict MVP sesuai §1.3, dokumentasikan post-MVP terpisah. |
| Mobile booking UX jelek | Medium | Medium | Responsive test di real device, date/time picker native-friendly. |

---

## 11. Appendix

### 11.1 Reference Links
- Next.js App Router: https://nextjs.org/docs/app
- TanStack Query (SSR/Next.js guide): https://tanstack.com/query/latest/docs/framework/react/guides/ssr
- better-auth: https://www.better-auth.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS v4: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion
- Recharts: https://recharts.org

### 11.2 Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2026-07-07 | PRD frontend dipisah dari dokumen fullstack v1.0. Ditetapkan fully SSR + hydrasi TanStack Query, Socket.io client untuk realtime, better-auth client untuk sesi staff, backend dikonsumsi sebagai API eksternal (Express, domain terpisah). | Technical Lead — Megatha Tech |
| 2.1 | 2026-07-08 | Drop Socket.io client — ganti jadi **polling** (TanStack Query `refetchInterval`) untuk semua update "live" (kitchen, cashier, booking), selaras dengan keputusan backend pindah ke Vercel Functions (serverless, tidak support WebSocket). | Technical Lead — Megatha Tech |

---

**End of Document**
