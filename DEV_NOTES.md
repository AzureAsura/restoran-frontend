# Dev Notes — Frontend (Palmdine / Megatha Kitchen)

Ringkasan evergreen dari `plan.md` (histori lengkap per-FASE ada di sana kalau butuh detail). File ini isinya cuma yang **masih relevan tiap kali dev lagi** — aturan, gotcha teknis, bug backend yang perlu diakalin, dan pattern yang reusable.

## Status

**Semua fase inti udah selesai** — full loop Booking → Tables → POS → Kitchen jalan end-to-end, plus Dashboard Analytics & Menu CRUD. `npx tsc --noEmit` & `npx eslint` bersih project-wide.

**Deferred (jangan mulai sebelum backend siap):**
- `/admin/settings` — gak ada endpoint `PATCH /admin/settings` di backend.
- AI Chat Widget — `src/modules/ai/*` backend masih placeholder kosong, `/ai/*` selalu 404.

## Stack & Arsitektur

| | Backend | Frontend |
|---|---|---|
| Stack | Express 5, TS, Prisma 7 (Neon Postgres), better-auth, Zod | Next.js 16 (App Router), React 19, TanStack Query 5, Tailwind v4, shadcn/Base UI |
| Peran | Source of truth, REST API, snake_case di boundary | UI publik + dashboard staff |
| Auth | better-auth (email/password, cookie httpOnly) | Cookie cross-origin, gate di `proxy.ts` |

- Route group: `(public)` (landing/menu/booking), `(admin)` (shell+sidebar), `(admin-standalone)` (kitchen & login, full-screen tanpa shell).
- Realtime = polling (bukan WebSocket, sengaja karena serverless): kitchen 4 detik, tables/POS/bookings 12 detik.
- Data langsung ke Express via `apiFetch`/`authFetch` — lihat catatan proxy cross-domain di bawah.

## ⚠️ Cross-domain cookie: WAJIB proxy lewat origin frontend sendiri

Backend & frontend di domain Vercel terpisah. Cookie session **gak punya `Domain` attribute**, jadi browser gak akan pernah kirim dia ke request ke domain frontend. Solusinya:
- `next.config.ts` — `rewrites()` proxy `/backend-api/*` → backend asli (pakai env server-only `BACKEND_URL`).
- `NEXT_PUBLIC_API_URL` = path relatif `/backend-api` (dipakai browser, biar cookie jadi first-party).
- `api-client.ts` / `auth-client.ts` — base URL pilih otomatis: `typeof window === "undefined" ? process.env.BACKEND_URL : process.env.NEXT_PUBLIC_API_URL` (server/SSG/SSR gak punya origin buat resolve path relatif, browser butuh same-origin).
- `proxy.ts` (middleware) pakai `BACKEND_URL` langsung (absolute), bukan `NEXT_PUBLIC_API_URL`.

## Konvensi Backend (WAJIB diikuti FE)

- Base URL tanpa prefix `/api` kecuali auth (`/api/auth/*`).
- Semua request `credentials: 'include'`.
- Response envelope: sukses `{success:true, data}` (list bisa ada `pagination`); error `{success:false, error:{code,message}}`. **Endpoint auth TIDAK ikut envelope ini** — `get-session` return raw `null`/object, error auth flat `{code,message}` — makanya `auth-client.ts` punya `AuthError` sendiri, bukan `ApiError`.
- Boundary API = **snake_case**.
- Uang = **integer USD cents** (`2500` → `$25.00`, pakai `formatUsd()` di `lib/utils.ts`).
- Timezone booking = **Asia/Jakarta eksplisit** — pakai `toLocaleDateString('en-CA', {timeZone:'Asia/Jakarta'})`, JANGAN `new Date()` polos (browser user bisa beda timezone).
- Nomor HP: `/^08\d{8,11}$/`.
- Auth (`sign-in`/`sign-out`) butuh header `Origin` valid (CSRF better-auth) — browser kirim otomatis, tapi kalau test manual pakai curl WAJIB tambah `-H "Origin: ..."`.

## Prinsip standing: Backend adalah kiblat

Kalau ada mismatch antara UI/mock dan kontrak backend (field, enum, casing, optional/required) — **yang disesuaikan selalu frontend**. Apapun yang ada di FE tapi gak ada di backend dianggap salah di FE. Jangan minta backend nambah dukungan buat sesuatu yang cuma ada di mock (contoh: area "VIP" dihapus dari FE karena backend cuma punya `indoor`/`outdoor`).

## Gotcha teknis penting

### SSR prefetch endpoint ber-auth — 2 syarat, bukan cuma 1
1. `void prefetchQuery(...)` tanpa `await` **cuma aman buat endpoint publik** (`/menu`). Endpoint `/admin/*` WAJIB **`await`** — kalau enggak, query masih `pending` pas `dehydrate()`, keluar dari hydrated state (`shouldDehydrateQuery` default cuma include `success`), client fetch ulang sendiri **tanpa cookie** → `401` palsu.
2. `await prefetchQuery(...)` **aja gak cukup** — `prefetchQuery` didesain `.catch(noop)`, gak pernah reject walau fetch-nya gagal beneran (mis. `403` role salah). Query tetap keluar dari `dehydrate()`, client fetch ulang tanpa cookie, muncul `401` yang **menyesatkan** (nutupin akar masalah 403 role).
   **Fix bener:** pakai **`fetchQuery`** (bukan `prefetchQuery`) dibungkus `try/catch`, render "Access Denied" kalau gagal. Lihat pola di `app/(admin)/admin/tables/page.tsx`.

### Server Component fetch ke endpoint auth butuh forward cookie manual
`fetch()` dari Server Component **TIDAK otomatis** meneruskan cookie browser — harus ambil manual via `(await cookies()).toString()` dan attach sebagai header `Cookie`. Tanpa ini semua prefetch ke `/admin/*` & `/api/auth/get-session` di server selalu dianggap belum login.

### Route guard 2 lapis
- `proxy.ts` (middleware) cek login + role (pakai `lib/admin-routes.ts` — `ADMIN_ROUTE_ROLES`, satu sumber kebenaran dipakai juga `AdminSidebar.tsx`) — nutup akses **sebelum** render/fetch apa pun.
- Halaman tetap punya fallback "Access Denied" (dari pola `fetchQuery`+`try/catch` di atas) sebagai defense-in-depth buat edge case.
- `ROLE_LANDING_PAGE` (`lib/role-landing.ts`) — map role→halaman utama, dipakai redirect setelah login & tombol "back" di Access Denied.

### Zod v4 (bukan v3!)
Custom error message di top-level schema constructor (`z.enum(values, {...})`) pakai key **`error`**, bukan `message` (deprecated tapi masih jalan). Method chain (`.min()`, `.refine()`) tetap terima string shorthand kayak v3. Kalau ragu cek `node_modules/zod/v4/core/api.d.ts` langsung.

### react-hook-form + `z.coerce`
Field yang di-coerce (mis. `party_size: z.coerce.number()`) butuh **3 generic** di `useForm`: `useForm<Input, Context, Output>` pakai `z.input<>`/`z.output<>` — 1 generic `z.infer<>` doang gak cukup (tipe input beda dari output).

### `@base-ui/react` (bukan Radix)
`Dialog`/`Select` pakai prop `render={<button/>}` buat trigger custom, **bukan** `asChild`.

### State lokal murni ≠ TanStack Query
Cart POS, filter/search input, view toggle, dialog open/close — semua tetap `useState` biasa. TanStack Query cuma buat data yang beneran dari backend.

## Bug/keterbatasan backend yang perlu diinget (bukan bug FE, tapi ngaruh ke FE)

1. **`Order.bookingId` gak pernah diisi** — `total_walk_ins` di analytics = semua order dianggap walk-in (order gak pernah tertaut ke booking).
2. **Hitungan menu populer pakai `_count` baris**, bukan qty — item dipesan sekali qty 10 dihitung 1.
3. **`listCategories` (admin) gak filter `isActive`** — kategori yang di-soft-delete tetap muncul di list admin (tapi item-nya hilang dari `/menu` publik).
4. **POS tax/service (10%/5%) hardcode di FE** — kebetulan match ke data seed sekarang, tapi gak ada endpoint publik buat baca `restaurant.settings` asli, jadi bisa geser kalau setting berubah.
5. Item kitchen yang di-mark `ready` **hilang dari `GET /admin/kitchen-queue`** by design (PRD) — makanya UI kitchen cuma 2 tahap (Pending→Cooking→langsung Served, skip `ready`).
6. Kitchen status di-track **per item**, bukan per order — 1 order bisa punya item di tahap beda-beda.

## Known gaps FE (dicatat, belum diperbaiki)

1. **`BookingForm.tsx` `TIME_SLOTS` statis** (`'17:00'`...`'22:30'`, sama persis tiap hari) — gak menyesuaikan jam operasional per hari. Sejak DB di-rename ke Megatha, jam buka beda per hari (`restaurant.openingHours`: Senin-Kamis `17:00-23:00`, Jumat-Minggu `16:00-23:59`), tapi form booking cuma nawarin satu daftar jam yang sama buat semua hari. Akibatnya customer gak bisa pilih jam 16:00/16:30 atau 23:00/23:30 di akhir pekan padahal resto buka — perlu digenerate per hari (atau minimal 2 varian: weekday/weekend), bukan array hardcode.

## Pattern & file reusable

- `lib/admin-routes.ts` — `ADMIN_ROUTE_ROLES` + `getAdminRouteRoles()`, dipakai `proxy.ts` & `AdminSidebar.tsx`.
- `lib/role-landing.ts` — `ROLE_LANDING_PAGE`.
- `lib/utils.ts` — `formatUsd()` (cents → `$X.XX`).
- `hooks/use-debounced-value.ts` — generic debounce, dipakai search box (Menu, Bookings, POS).
- `components/ui/dropdown-menu.tsx` — reuse ini buat dropdown/popup, jangan bikin manual pakai `useState`+div absolut.
- Pola Skeleton per halaman: `*Skeleton.tsx` match dimensi asli biar gak ada layout shift, dipasang di `<Suspense fallback={...}>` server-side.
- Pola split Server+Client: `page.tsx` (Server, `fetchQuery`+`try/catch`+Access Denied) → child `*Board.tsx` (`'use client'`, `useSuspenseQuery`+polling+mutation).

## Lain-lain

- `frontend/templateui.md` (kalau masih ada) itu file referensi visual yang **isinya berubah-ubah** tiap user minta styling baru — bukan dokumen statis, bukan kode buat di-copy-paste mentah (logic-nya beda, misal auth pola server action vs `useSession()` yang dipakai project ini). Baca ulang tiap dirujuk, analisis diff CSS-only-nya doang.
- Dev server kadang punya sesi sendiri yang jalan persisten — hati-hati restart sembarangan.
