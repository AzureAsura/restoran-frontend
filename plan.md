# Plan: Connect Backend ↔ Frontend (Megatha Kitchen / "Palmdine")

## Context

Frontend (`frontend/`) saat ini adalah **UI-only prototype — 0% terhubung ke backend**. Semua page pakai data hardcoded/mock (`useState` seed), hilang saat refresh. Library data layer (`@tanstack/react-query`, `react-hook-form`, `zod`) sudah terinstall tapi **belum dipakai sama sekali**. Folder `types/`, `config/`, `server/`, `hooks/`, `lib/validations/`, `lib/utils/` semuanya kosong. Tidak ada API client, env, auth, maupun shared types.

Backend (`backend/`) sudah **lengkap dan jalan** di `http://localhost:4000` (Express 5 + Prisma + Neon Postgres, auth = better-auth cookie httpOnly). Semua endpoint operasional sudah ada kecuali AI Concierge (`POST /ai/chat` masih placeholder kosong) dan update Restaurant Settings (tidak ada endpoint).

**Tujuan plan ini:** (1) tentukan urutan eksekusi step-by-step yang benar (§1), (2) tentukan strategi rendering SSR/Client/TanStack per halaman (§2), (3) bangun data layer + auth di frontend (§3-§4), (4) connect page yang UI-nya sudah jadi ke endpoint backend (§5), (5) kasih daftar jelas UI mana yang sudah/belum dibuat (§6).

**Keputusan yang sudah disepakati:**
- Auth = **fetch tipis** (tanpa dependency `better-auth` client) → login/logout/session lewat `fetch` ke `/api/auth/*` + hook `useSession` via TanStack Query.
- Scope = **connect dulu page yang sudah ada**, page baru cukup didaftar sebagai TODO (lihat §6).
- Settings page & AI Chat = **defer** (backend belum support) — dicatat di §7.
- **🎯 PRINSIP STANDING (berlaku di semua fase, bukan cuma sekali):** **backend adalah kiblat/source of truth.** Kalau ada mismatch antara mock UI frontend dan kontrak asli backend (nama field, enum, casing, optional/required, response shape), yang **disesuaikan selalu frontend**, bukan minta backend nambah dukungan buat sesuatu yang cuma ada di mock UI. Apapun yang ADA di frontend tapi TIDAK ADA di backend itu **dianggap salah di frontend**. Instruksi eksplisit user (14 Juli 2026). Contoh penerapan konkret: area "VIP" (lihat di bawah).

**Konvensi backend yang WAJIB diikuti frontend:**
- Base URL `http://localhost:4000`, **tanpa prefix `/api`** kecuali auth (`/api/auth/*`).
- Semua request pakai `credentials: 'include'` (session = cookie cross-origin).
- Response envelope: sukses `{ success: true, data: ... }` (list bisa ada sibling `pagination`); error `{ success: false, error: { code, message } }`.
- **Boundary API = snake_case** (mis. `customer_name`, `booking_date`).
- **Semua uang = integer USD cents** → bagi 100 untuk tampil (mis. `2500` → $25.00). ⚠️ Lihat catatan klarifikasi currency di §1 Step 0 dan §5.
- Timezone `Asia/Jakarta`; nomor HP format Indonesia `08xxxxxxxx` (`/^08\d{8,11}$/`).

---

## 1. Urutan Eksekusi — Step by Step

Prinsip urutan: **fondasi dulu → yang tanpa-auth dulu → yang butuh-auth sesuai dependency data** (mis. Kitchen baru bisa dites nyata kalau POS sudah bisa bikin order asli; Bookings admin baru kelihatan isinya kalau Booking form publik sudah bikin data asli). Setiap step punya **Start / End / Verifikasi** — jangan lanjut ke step berikutnya sebelum verifikasi step saat ini lolos.

### Step 0 — Pra-syarat (sebelum nulis kode apa pun)
- **Start:** sekarang. **End:** siap ngoding.
- Jalankan backend (`cd backend && npm run dev`), pastikan `DATABASE_URL` nyambung ke Neon, ada row `Restaurant` (minimal 1, dengan `opening_hours` &amp; `settings.tax_rate`/`service_charge` terisi — booking &amp; POS akan gagal validasi kalau ini kosong), dan 3 akun staff seeded (owner/cashier/kitchen).
- **Putuskan 2 hal terbuka dari analisis sebelumnya** (jangan diasumsikan sepihak saat coding):
  1. **Currency**: backend bilang "integer USD cents", tapi mock UI (POS/Menu) pakai format Rupiah. Ini WAJIB diputuskan sebelum Step 5 (Menu) &amp; Step 8 (POS) — apakah tampilan tetap `Rp` (dan berarti angka di DB sebenarnya rupiah, "USD cents" di docs backend cuma penamaan generik), atau beneran USD dan UI harus diganti ke `$`.
  2. ~~**Area "VIP"**~~ — **SUDAH DIPUTUSKAN** (sesuai prinsip "backend adalah kiblat" di atas): backend cuma punya `indoor`/`outdoor`, jadi "VIP" **dihapus** dari filter area di Bookings/POS. Yang ada di POS mock (`VIP-1`, `VIP-2`) itu cuma **nama meja** (boleh tetap, itu bukan area), bukan area baru. Tidak perlu minta backend nambah enum.
- Install dependency yang pasti kepakai di awal: `npm install sonner` (toast dipakai dari Step 1). `recharts` boleh nanti pas Step 10.

### Step 1 — Fondasi Data Layer (detail: §3)
- **Start:** setelah Step 0. **End:** `lib/api-client.ts`, `lib/query-client.ts`, `app/providers.tsx` (ter-mount di `app/layout.tsx`), `types/api.ts`, `lib/queries/` (skeleton per domain) semua ada dan project compile bersih.
- Ini murni infrastruktur — **belum ada page yang berubah tampilannya**.
- **Verifikasi:** `npm run dev` jalan tanpa error di semua route yang sudah ada (belum ada perubahan visual/fungsional, cuma smoke-test Providers tidak merusak apa pun).

### Step 2 — Fondasi Auth (detail: §4)
- **Start:** setelah Step 1. **End:** `lib/auth-client.ts`, `hooks/use-session.ts`, `middleware.ts` (guard `/admin/*` kecuali `/admin/login`) sudah ada. **Belum** dipasang ke form login (itu Step 3).
- **Verifikasi:** tes manual dulu di luar UI — pakai `curl`/Postman `POST /api/auth/sign-in/email` dengan akun seed, simpan cookie, lalu `GET /api/auth/get-session` pakai cookie itu, konfirmasi shape response (`user.role` field-nya benar) sebelum dipakai di kode. Cek juga: buka `/admin/tables` di browser tanpa login → harus ke-redirect ke `/admin/login` (middleware jalan).

### Step 3 — Wire Login + Admin Session Shell (detail: §5, baris Login &amp; Admin layout)
- **Start:** setelah Step 2. **End:** `/admin/login` pakai `signIn()` asli (bukan simulasi role). `app/(admin)/layout.tsx` displit jadi Server Component (prefetch session, forward cookie manual) + Client `AdminShell` yang baca role dari `useSession()`. Sidebar: buang role switcher demo, benerin link `#anchor` mati jadi path asli. Logout jalan.
- **Ini gate penting** — semua step admin berikutnya butuh auth ini beres duluan, kalau belum, semua `useQuery` admin bakal 401.
- **Verifikasi:** login pakai owner/cashier/kitchen satu-satu → sidebar menu yang muncul sesuai role masing-masing; logout → balik ke login; akses halaman di luar role (mis. kitchen buka `/admin/tables`) tertangani (redirect/blocked, bukan cuma tersembunyi di sidebar).

### Step 4 — Wire Menu Publik (detail: §5, baris Menu) — currency sudah diputuskan di Step 0
- **Start:** setelah Step 1 (tidak butuh auth, bisa duluan kalau mau paralel, tapi urutan ini asumsi dikerjakan sendirian/sequential). **End:** `/menu` render dari `GET /menu` asli, harga sesuai keputusan currency, tab kategori digenerate dari data (bukan array hardcoded).
- **Verifikasi:** bandingkan render dengan response `curl http://localhost:4000/menu` manual; cek tab Network browser — ganti tab kategori/search TIDAK memicu request baru (harus filter in-memory dari cache).

### Step 5 — Wire Booking Form + Konfirmasi (detail: §5, baris Booking form/Konfirmasi)
- **Start:** setelah Step 1 (tidak butuh auth). **End:** `BookingForm.tsx` pakai `react-hook-form`+`zod`, submit `POST /bookings` asli, redirect ke `/booking/konfirmasi?code=...` dengan data hasil mutation asli, tombol "Add to Calendar" generate `.ics` beneran.
- **Kenapa sebelum Step 7 (admin Bookings):** supaya ada data booking ASLI untuk dites tampil di halaman admin nanti — jangan wiring admin Bookings duluan cuma buat lihat list kosong.
- **Verifikasi:** submit booking valid → landing di konfirmasi dengan `booking_code` asli; cek data itu benar-benar masuk DB via `curl -b <cookie> http://localhost:4000/admin/bookings` (pakai cookie dari Step 2, karena UI admin belum wired).

### Step 6 — Wire Admin Tables (detail: §5, baris Tables) — butuh Step 3 beres
- **Start:** setelah Step 3. **End:** `page.tsx` displit Server+Client, `TablesBoard.tsx` (client) pakai `useQuery`+polling+`useMutation` CRUD nyata.
- **Kenapa duluan dari Bookings/POS/Kitchen:** ini yang paling sederhana (CRUD 1 resource) dan jadi **pola rujukan** (Server+Client split) yang dipakai ulang persis di Step 7 &amp; 9.
- **Verifikasi:** create/edit/delete meja → persist setelah refresh; hapus meja yang lagi dipakai booking/order → toast `409 TABLE_IN_USE`; role cashier bisa lihat tapi tombol edit/create/delete disembunyikan atau ditolak (owner-only).

### Step 7 — Wire Admin Bookings (detail: §5, baris Bookings) — butuh Step 3 + Step 5 (keputusan "VIP area" sudah selesai, lihat Step 0)
- **Start:** setelah Step 3 dan Step 5. **End:** List/Timeline pakai `useQuery` asli (query key dinamis date/status/area/search) + polling + `PATCH` aksi (Seated/No-Show/Cancel).
- **Verifikasi:** booking yang disubmit di Step 5 muncul di list; ganti tanggal/filter memicu refetch baru (cek Network); klik Mark Seated/No-Show/Cancel → persist setelah refresh.

### Step 8 — Wire Admin POS (detail: §5, baris POS) — butuh Step 6 + Step 4 + keputusan currency
- **Start:** setelah Step 6 (Tables) dan Step 4 (Menu), karena POS **reuse query cache** dari keduanya. **End:** Floor plan &amp; grid menu pakai data asli, cart tetap `useState` lokal, submit → `POST /admin/orders` asli (bukan `alert()`).
- **Verifikasi:** pilih meja + tambah item + submit → cek meja itu otomatis jadi `occupied` di halaman Tables (Step 6) tanpa refresh manual (invalidate cache lintas-halaman kerja); cek order muncul via `curl` `GET /admin/orders` (Kitchen belum wired di step ini).

### Step 9 — Wire Admin Kitchen (detail: §5, baris Kitchen) — butuh Step 8 supaya ada order-item asli untuk ditampilkan
- **Start:** setelah Step 8. **End:** Queue pakai `useQuery`+polling 3-5s asli, `useMutation` optimistic per status, timer elapsed dari `created_at` asli.
- **Ini milestone "full loop" pertama**: Booking (Step 5) → assign meja → POS bikin order (Step 8) → Kitchen proses (Step 9) → order auto-complete → meja balik `available` (kembali kelihatan di Step 6 Tables).
- **Verifikasi (end-to-end, paling penting di seluruh plan ini):** submit order dari POS dengan 2+ item → muncul di Kitchen ≤5 detik → advance semua item sampai `served` → order otomatis `completed` di backend → meja balik status `available` di halaman Tables tanpa aksi manual tambahan.

### Step 10 — Bangun Dashboard Analytics (detail: §6.A, halaman baru)
- **Start:** setelah Step 9 (supaya ada data asli — booking/order/revenue — biar chart tidak kosong; secara teknis cuma butuh Step 1+Step 3). **End:** page baru, prefetch 3 endpoint analytics paralel, `recharts` terpasang, stat cards + bar chart + top-5 menu.
- **Verifikasi:** angka di stat card cocok dengan hitungan manual dari data yang sudah dibuat di step-step sebelumnya (booking hari ini, revenue dari order yang sudah completed).

### Step 11 — Bangun Menu CRUD (detail: §6.B, halaman baru)
- **Start:** setelah Step 4 (Menu publik) dan Step 3 (auth); tidak bergantung ke Step 10. **End:** page baru — tabel menu + modal CRUD + upload gambar (Cloudinary via backend) + kelola kategori.
- **Verifikasi:** tambah menu item baru dengan foto → langsung muncul di `/menu` publik (Step 4) setelah invalidate; edit harga; toggle `out_of_stock` → hilang dari tampilan publik; soft-delete.

### Step 12 — Regresi penuh (detail: §9 Verifikasi)
- **Start:** setelah semua step di atas selesai. **End:** jalankan seluruh checklist §9 dari awal berurutan, cek 0 hydration mismatch khususnya di halaman yang di-split Server/Client (Tables, Bookings, POS, Kitchen, Admin layout), cek matrix role di ke-3 akun untuk semua halaman.

### Tidak dikerjakan di iterasi ini
- **Settings &amp; AI Chat Widget** (§7) — backend belum ada endpoint-nya, jangan mulai sampai backend nambah.

---

## 2. Strategi Rendering — SSR vs Client Component vs TanStack Query

### 2.1 Tabel definitif: mana yang bisa server-fetch, mana yang wajib client-fetch

Ini jawaban langsung per halaman — **"bisa server fetch"** = data awal boleh diambil di `page.tsx` (Server Component) via `prefetchQuery` lalu di-hydrate; **"wajib client-fetch"** = tidak bisa/tidak perlu diambil di server sama sekali, harus lewat `useQuery`/`useMutation` di browser.

| Halaman | Data yang dibutuhkan | Bisa server-fetch (SSR prefetch)? | Wajib client-fetch? | Kenapa |
|---|---|---|---|---|
| `/` Landing | — (statis) | Tidak perlu fetch sama sekali | — | Semua konten marketing statis; tidak ada endpoint backend untuk info restoran (lihat gap di Kategori A). |
| `/menu` | `GET /menu` (public) | ✅ **Ya** — public, tanpa auth | Filter tab/search (in-memory dari cache yang sudah di-hydrate) | Endpoint publik, tidak butuh cookie, aman di-prefetch di server tanpa syarat tambahan. |
| `/booking` (form) | — (tidak ada GET) | Tidak ada yang bisa di-prefetch | `POST /bookings` wajib client (`useMutation`, dipicu submit user) | Form murni, tidak ada data awal untuk ditampilkan. |
| `/booking/konfirmasi` | Data booking hasil submit | ❌ **Tidak bisa** — tidak ada endpoint publik "GET booking by code" | Wajib client — data dibawa dari response mutation (query param/sessionStorage), bukan fetch ulang | Gap backend: tidak ada cara re-fetch booking by code kalau halaman di-refresh. |
| `/admin/login` | — (tidak ada GET) | Tidak ada yang bisa di-prefetch | `POST /api/auth/sign-in/email` wajib client | Form murni. |
| Admin layout (`app/(admin)/layout.tsx`) | `GET /api/auth/get-session` | ✅ **Bisa**, tapi butuh **forward cookie manual** (lihat §2.2 catatan penting) | Client tetap perlu `useSession()` untuk re-check saat logout/role berubah tanpa reload | Endpoint auth butuh session cookie; server fetch ke domain lain TIDAK otomatis meneruskan cookie browser kecuali di-attach manual dari `next/headers`. |
| `/admin/tables` | `GET /admin/tables` | ✅ **Bisa** (dengan forward cookie) | Polling `refetchInterval` 10-15s + semua mutasi CRUD wajib client | Data awal bisa SSR untuk first paint cepat; update berkala & mutation harus di browser. |
| `/admin/bookings` | `GET /admin/bookings?date=` | ✅ **Bisa** (dengan forward cookie), untuk `date=today` saja | Ganti tanggal/filter/search → refetch client (query key baru); polling 10-15s; semua `PATCH` aksi wajib client | SSR cuma untung untuk render pertama; begitu user ganti filter, itu selalu client-side. |
| `/admin/pos` | `GET /admin/tables` + `GET /menu` | ✅ **Bisa keduanya** (parallel prefetch, share cache dgn page Tables/Menu) | Pilih meja, cart/order draft, keyboard shortcut (`useEffect`+`window.addEventListener`), submit `POST /admin/orders` — **semua wajib client**, cart TIDAK PERNAH masuk TanStack Query (state lokal murni sampai submit) | Data referensi (meja+menu) bisa di-hydrate; interaksi kasir 100% client karena butuh `window` events & state transient. |
| `/admin/kitchen` | `GET /admin/kitchen-queue` | ✅ **Bisa** untuk render pertama (dengan forward cookie) | Polling wajib `refetchInterval` 3000-5000ms; timer elapsed (`setInterval`); mutation status — semua wajib client | Endpoint `no-store`: prefetch sekali OK, tapi "live" cuma lewat polling client, tidak ada cara lain. |
| `/admin/dashboard` (belum dibangun) | `GET /admin/analytics`, `/timeline`, `/menu-performance` | ✅ **Bisa ketiganya** (parallel prefetch, dengan forward cookie) | Ganti tanggal via date picker → refetch client; render chart (Recharts) wajib client (butuh DOM measurement browser) | |
| `/admin/menu` CRUD (belum dibangun) | `GET /admin/menu`, `GET /admin/menu-categories` | ✅ **Bisa keduanya** (dengan forward cookie) | Semua CRUD + upload gambar (`multipart/form-data`, file input) wajib client | |

### 2.2 Aturan umum & catatan penting

1. **Server Component (SSR)** dipakai di `page.tsx` untuk route yang punya data GET awal atau konten statis. Kalau ada data awal: `await queryClient.prefetchQuery(...)` lalu bungkus children dengan `<HydrationBoundary state={dehydrate(queryClient)}>`.
2. **Client Component (`'use client'`)** WAJIB kalau file itu pakai: `useState`/`useEffect`/hook lain, event handler (`onClick`, `onChange`, `onSubmit`), form interaktif (react-hook-form), `useQuery`/`useMutation`, library browser-only (Framer Motion, Embla Carousel, Recharts), polling (`refetchInterval` hanya jalan di browser), optimistic update, timer (`setInterval` untuk elapsed time di kitchen/keyboard shortcut di POS), atau file upload/preview.
3. **TanStack Query** dipakai kalau data berasal dari backend DAN butuh salah satu dari: (a) hydration dari SSR biar first paint cepat & tidak ada duplicate fetch, atau (b) polling/mutation/cache invalidation setelahnya. Mutation murni tanpa GET awal (mis. form booking) cukup `useMutation` di Client Component, tanpa perlu prefetch. **State lokal murni (cart POS, filter/search, view toggle, mobile panel aktif, dialog open/close) BUKAN urusan TanStack Query sama sekali** — itu tetap `useState` biasa, baik di halaman SSR maupun full-client.
4. **⚠️ Cookie forwarding untuk SSR ke endpoint yang butuh auth**: backend ada di origin terpisah (`localhost:4000` vs frontend `localhost:3000`). Saat browser fetch pakai `credentials:'include'`, cookie session otomatis terkirim. Tapi saat **Server Component** Next.js melakukan `fetch()` ke backend, cookie dari request masuk **TIDAK otomatis diteruskan** — harus diambil manual via `cookies()` dari `next/headers` dan di-attach sebagai header `Cookie` ke request server-side. Tanpa ini, semua prefetch ke endpoint `/admin/*` &amp; `/api/auth/get-session` di server akan selalu dianggap "belum login". Middleware yang sudah validasi session tidak menggantikan langkah ini — itu cuma gate redirect, bukan mekanisme forward cookie ke fetch lain.
5. `QueryClientProvider` sendiri harus `'use client'` (`app/providers.tsx`), tapi diinstansiasi di dalam root `layout.tsx` yang tetap Server Component — pola hybrid standar Next.js App Router.
6. Middleware (`middleware.ts`) menjalankan auth-guard di edge **sebelum** render apa pun — ini terpisah dari pertanyaan SSR/CSR, jalan di setiap request ke `/admin/*` terlepas dari jenis komponennya.

### Temuan kondisi kode saat ini (penting — banyak yang perlu di-refactor, bukan cuma "tambah fetch")

Dicek langsung ke file: `app/(admin)/admin/tables/page.tsx`, `.../bookings/page.tsx`, `.../pos/page.tsx`, dan `app/(admin-standalone)/admin/kitchen/page.tsx` **semuanya `'use client'` dari baris pertama** — artinya page.tsx-nya sendiri jadi Client Component penuh, tidak ada SSR sama sekali di situ. Ini **menyalahi pola PRD** (§4.2 `frontend.md`: page.tsx harus Server Component + prefetch + `HydrationBoundary`, interaksi lanjut di child Client Component). Sebaliknya, `/menu`, `/booking`, `/admin/login` sudah benar sebagai Server Component murni — tinggal ditambah prefetch.

**Implikasi:** untuk 4 halaman admin itu (Tables, Bookings, POS, Kitchen), wiring bukan cuma "sambungkan fetch" tapi juga **split file**: pindahkan isi interaktif ke child Client Component baru, ubah `page.tsx` jadi Server Component yang `prefetchQuery` + `HydrationBoundary`.

### Kategori A — Server Component murni, TANPA TanStack Query (statis/marketing, tidak ada data backend)

| Route/File | Alasan |
|---|---|
| `/` — `app/page.tsx` | Konten Hero/StoryGallery/Testimonials/InfoCards/RestaurantEvents semuanya statis (Unsplash + constant lokal). **Gap backend**: tidak ada endpoint publik `GET /restaurant` untuk `opening_hours`/alamat/telepon — PRD berasumsi ada, tapi backend tidak menyediakannya. Sampai endpoint itu dibuat, biarkan info kontak hardcoded di sini. Child seperti `FlowingMenu.tsx`, `RestaurantEvents.tsx`, `Testimonials.tsx` boleh tetap `'use client'` (butuh Framer Motion/Embla) — itu normal, nested client leaf di dalam Server Component page tetap valid. |

### Kategori B — Server Component (SSR prefetch) + Client Component (hydrate, lanjut interaksi via TanStack Query)

| Route/File | Server (page.tsx) | Client (component) | Catatan |
|---|---|---|---|
| `/menu` | Prefetch `menuQueryOptions()` (`GET /menu`) | `MenuSection.tsx` **perlu ditambah `'use client'`** (sekarang belum ada directive) + `useQuery` + filter/search lokal in-memory | `MenuCategory.tsx` sudah `'use client'`, tetap jadi nested child. |
| `/admin/tables` | **Split baru**: `page.tsx` jadi Server Component, prefetch `tablesQueryOptions()` (`GET /admin/tables`) | Pindahkan grid+dialog ke child baru mis. `TablesBoard.tsx` (`'use client'`), `useQuery` + `refetchInterval` 10-15s + `useMutation` CRUD | Saat ini seluruh page = client; harus dipecah. |
| `/admin/bookings` | **Split baru**: `page.tsx` jadi Server Component, prefetch `bookingsQueryOptions({date: today})` | Pindahkan List/Timeline UI ke child Client Component, `useQuery` dgn query key dinamis (date/status/area/search), `refetchInterval` 10-15s, `useMutation PATCH` utk Seated/No-Show/Cancel | UI List+Timeline sudah jadi (mock 5 booking). Perlu split Server+Client sama seperti Tables/Kitchen. |
| `/admin/pos` | **Split baru**: `page.tsx` jadi Server Component, parallel prefetch `tablesQueryOptions()` + `menuQueryOptions()` (share cache dgn page Tables/Menu) | Pindahkan 3-panel UI ke child Client Component: `useQuery` keduanya + draft cart di `useState` lokal (BUKAN TanStack — order draft baru jadi server state saat submit) + keyboard shortcut (`useEffect`) + `useMutation POST /admin/orders` | UI 3-panel (Floor Plan/Menu/Summary) sudah jadi (mock 8 meja, 9 menu item). Perlu split Server+Client. |
| `/admin/kitchen` | **Split baru**: `page.tsx` jadi Server Component, prefetch sekali `kitchenQueueQueryOptions()` (`GET /admin/kitchen-queue`) untuk first paint cepat di TV/tablet | Pindahkan queue+timer ke child Client Component, `refetchInterval` 3000-5000ms (endpoint `no-store`), `useMutation` optimistic utk `PATCH /admin/order-items/:id`, `setInterval` utk elapsed time (inherently client) | |
| `/admin/dashboard` (dibangun baru, §6.A) | Server Component, parallel prefetch 3 query (`analytics`, `timeline`, `menu-performance`) via `Promise.all` | Client component: `useQuery` ketiganya (hydrated) + refetch saat ganti tanggal (query key dinamis); komponen chart **Recharts wajib `'use client'`** (butuh DOM measurement browser) | |
| `/admin/menu` (dibangun baru, §6.B) | Server Component, prefetch `adminMenuQueryOptions()` + `menuCategoriesQueryOptions()` | Client component: tabel + modal CRUD, `useMutation` (termasuk upload gambar `multipart/form-data`), invalidate `['menu']`/`['menu-categories']` on save | |
| `app/(admin)/layout.tsx` | **Split baru**: outer `layout.tsx` jadi Server Component, prefetch `sessionQueryOptions()` (`GET /api/auth/get-session`) | Delegasikan ke child Client `AdminShell.tsx` (state mobile-sidebar) yang baca role via `useQuery(sessionQueryOptions())` hydrated — hindari flash "role salah" sebelum session resolve | Saat ini seluruh layout `'use client'`; sidebar filter role pakai `useState` demo, harus diganti baca dari hook session. |

### Kategori C — Client Component murni, TIDAK perlu SSR prefetch (form/mutation-only, tidak ada GET awal yang berarti)

| Route/File | Alasan |
|---|---|
| `/booking` → `BookingForm.tsx` | Tidak ada GET awal (tidak ada endpoint jam operasional publik). Cukup Client Component: `react-hook-form` + `zod` + `useMutation(POST /bookings)`. `page.tsx` boleh tetap Server Component murni (cuma render `<BookingForm/>` + `<Footer/>`), tanpa prefetch. |
| `/admin/login` → `AdminLoginForm.tsx` | Form murni + `useMutation(signIn)`, tidak ada GET. `page.tsx` tetap Server Component wrapper. |
| `/booking/konfirmasi` | Sudah `'use client'` (benar). **Gap backend**: tidak ada endpoint publik "GET booking by code" untuk re-fetch saat halaman di-refresh — data booking cuma tersedia dari response mutation `POST /bookings`. Rekomendasi: kirim data via `router.push` dengan query params (`?code=WB-...`) atau `sessionStorage` sebelum navigate; **bukan** TanStack Query prefetch karena tidak ada endpoint untuk itu. Kalau backend nanti nambah `GET /bookings/:code` publik, halaman ini bisa naik ke Kategori B. |

---

## 3. Fondasi Data Layer (bangun dulu, dipakai semua page)

Buat file baru:

- **`.env.local`** → `NEXT_PUBLIC_API_URL=http://localhost:4000`
- **`lib/api-client.ts`** — wrapper `fetch` tunggal:
  - Prepend `NEXT_PUBLIC_API_URL`, selalu set `credentials: 'include'`.
  - Parse envelope: kalau `success:false` lempar `ApiError(code, message)` (biar ditangkap TanStack Query `onError` → toast Sonner).
  - Return `data` langsung kalau sukses. Handle `204` (no content) & response `multipart` (untuk menu upload) tanpa `Content-Type` manual.
- **`lib/query-client.ts`** — `getQueryClient()` singleton per-request pakai `cache()` dari React (pola resmi TanStack Query App Router), + factory client untuk browser.
- **`app/providers.tsx`** (`'use client'`) — `QueryClientProvider`. Mount di `app/layout.tsx` (bungkus `{children}` di dalam `<body>`). Sekalian tambah `<Toaster/>` (Sonner) — **catatan: `sonner` belum ada di `package.json`, perlu diinstall**. Sekalian ganti `metadata.title` yang masih "Create Next App".
- **`types/api.ts`** — shared TS types mirror DTO backend (snake_case): `Booking`, `MenuCategory`, `MenuItem`, `Table`, `Order`, `OrderItem`, `KitchenQueueItem`, `Analytics*`, `Session`. Ini isi folder `types/` yang sekarang kosong.
- **`lib/queries/`** — `queryOptions` per domain (`menu.ts`, `bookings.ts`, `tables.ts`, `orders.ts`, `kitchen.ts`, `analytics.ts`, `session.ts`) biar bisa di-share antara SSR prefetch dan client `useQuery` (lihat §2 tabel — query key harus identik di kedua sisi biar hydration match, zero mismatch).

## 4. Auth (fetch tipis)

- **`lib/auth-client.ts`** — 3 fungsi fetch tipis:
  - `signIn(email, password)` → `POST /api/auth/sign-in/email`
  - `signOut()` → `POST /api/auth/sign-out`
  - `getSession()` → `GET /api/auth/get-session` (return `null` kalau belum login).
- **`hooks/use-session.ts`** — `useSession()` (TanStack Query, key `['session']`) baca `session.user.role` (`owner`/`cashier`/`kitchen`).
- **`middleware.ts`** (root frontend) — guard `/admin/*` (kecuali `/admin/login`): cek `GET /api/auth/get-session` (teruskan cookie request); kalau null → redirect. **catatan penting:** route login di FE saat ini `/admin/login`, bukan `/login` seperti di PRD. Plan pakai path aktual `/admin/login`.
- Seeded akun dev untuk testing: owner `owner@warungbagas.id` / `Owner#12345`, cashier `cashier@warungbagas.id` / `Cashier#12345`, kitchen `kitchen@warungbagas.id` / `Kitchen#12345`.

---

## 5. Wiring page yang UI-nya SUDAH ADA (fokus utama)

Pola per page: lihat kategori di §2. Ringkasan endpoint per halaman:

| Page (file) | Endpoint backend | Yang harus dikerjakan |
|---|---|---|
| **Menu publik** `app/(public)/menu/page.tsx` (`MenuSection.tsx`) | `GET /menu` | Ganti array `menuItems` hardcoded → data real (grouped by category). Harga `/100`. Tab kategori & search = filter client dari cache. |
| **Booking form** `app/(public)/booking/BookingForm.tsx` | `POST /bookings` | Pakai `react-hook-form` + `zod` (validasi HP `08...`, party_size 1–20, tanggal ≥ hari ini). Submit `useMutation`; sukses → redirect `/booking/konfirmasi` bawa data response. Hapus tombol "Toggle UI Error Style" (simulasi). Map error `422 OUTSIDE_OPERATING_HOURS` & `409 NO_TABLE_AVAILABLE` ke toast. |
| **Konfirmasi** `app/(public)/booking/konfirmasi/page.tsx` | (dari response `POST /bookings`) | Tampilkan data booking asli (`booking_code`, `table.name`, area, dll) bukan `bookingDetails` hardcoded. Tombol "Add to Calendar" generate `.ics` di client (belum ada logic, sekarang cuma `console.log`). |
| **Login staff** `app/(admin-standalone)/admin/login/page.tsx` (`AdminLoginForm.tsx`) | `POST /api/auth/sign-in/email` | Ganti "simulated role detector" → `signIn()` beneran. Sukses → invalidate `['session']` → redirect ke landing admin sesuai role. Handle 401. |
| **Admin layout** `app/(admin)/layout.tsx` + `AdminSidebar.tsx` + `AdminTopbar.tsx` | `GET /api/auth/get-session`, `POST /api/auth/sign-out` | Split jadi Server+Client (lihat §2). Sidebar: buang "Demo Role Switcher" `useState`, ganti pakai `role` dari `useSession`. **Link nav sekarang `#dashboard`/`#tables` (anchor mati) → ganti ke path asli** `/admin/tables`, `/admin/kitchen`, dst. Topbar: nama staff dari session, tombol Logout panggil `signOut()`. |
| **Tables mgmt** `app/(admin)/admin/tables/page.tsx` | `GET/POST/PATCH/DELETE /admin/tables` | Split jadi Server+Client (lihat §2). Ganti seed 4 meja → `useQuery` (`refetchInterval` ~10-15s). Dialog edit/create → `useMutation` → invalidate `['tables']`. Handle `409 TABLE_IN_USE` saat delete. Role: read = owner+cashier, write = **owner only**. |
| **Bookings** `app/(admin)/admin/bookings/page.tsx` | `GET /admin/bookings?date=`, `PATCH /admin/bookings/:id` | Split jadi Server+Client (lihat §2). Ganti 5 mock booking → `useQuery` (query key `[date, status, area, search]`, `refetchInterval` ~10-15s). Aksi Seated/No-Show/Cancel → `useMutation PATCH` → invalidate. Role: owner+cashier. |
| **POS** `app/(admin)/admin/pos/page.tsx` | `GET /admin/tables`, `GET /menu`, `POST /admin/orders`, `GET /admin/orders/:id/bill`, `PATCH /admin/orders/:id` | Split jadi Server+Client (lihat §2). Ganti `MOCK_MEJA`/`MOCK_MENU` → `useQuery` (share cache dgn page Tables/Menu). Cart tetap `useState` lokal. Submit → `useMutation POST /admin/orders` (bukan `alert()`), invalidate `['orders']`,`['tables']`. Role: owner+cashier. |
| **Kitchen display** `app/(admin-standalone)/admin/kitchen/page.tsx` | `GET /admin/kitchen-queue`, `PATCH /admin/order-items/:id` | Split jadi Server+Client (lihat §2). Ganti `MOCK_KITCHEN_ORDERS` → `useQuery` dgn **`refetchInterval: 3000-5000`** (endpoint `no-store`). Tombol status → `useMutation` optimistic (`pending→cooking→ready→served`); `served` otomatis complete order di backend. Timer elapsed pakai `created_at` real. Role: owner+kitchen. |

**Catatan mismatch yang harus diberesin saat wiring:**
- Sidebar kasih role `Menu Editor` & `Tables Management` ke CASHIER/OWNER berbeda dari backend (menu write = owner-only, tables read = owner+cashier). Samakan role matrix sidebar ke matrix backend: **owner** = semua; **cashier** = Bookings + POS + Menu(read); **kitchen** = Kitchen saja.
- Konsolidasi route group: `/admin/tables|bookings|pos` ada di `(admin)`, sementara `/admin/kitchen|login` di `(admin-standalone)`. Kitchen memang sengaja tanpa sidebar (OK). Pastikan middleware guard nangkap kedua group.
- **✅ SELESAI DIPUTUSKAN — Mock Bookings pakai area `VIP`** (`Booking['area']: 'INDOOR'|'OUTDOOR'|'VIP'`) — backend `Table.area` cuma enum `indoor`/`outdoor` (`Booking.area_preference` juga cuma `indoor|outdoor|no_preference`). Sesuai prinsip "backend adalah kiblat": **VIP dihapus** dari filter/enum area pas wiring FASE 7, filter area cuma `Indoor`/`Outdoor`. Nama meja `VIP-1`/`VIP-2` di POS mock boleh tetap (itu `table.name`, bukan `area`).
- **⚠️ Mock POS format harga pakai Rupiah** (`Rp 85.000`, `toLocaleString('id-ID')`, tax dihitung dari harga rupiah langsung) — sementara backend `context.md` menyatakan eksplisit **semua uang = integer USD cents**. `harga: 85000` di mock kalau diperlakukan sebagai cents backend = $850.00, bukan Rp85.000. **Ini konflik nyata antara asumsi UI (IDR) dan konvensi backend (USD cents)** — perlu diklarifikasi ke user/tim backend sebelum wiring Menu &amp; POS (lihat §1 Step 0), jangan diam-diam dikonversi salah satu arah.
- Status enum mock beda casing dari backend: mock pakai `'CONFIRMED'|'SEATED'|...|'NO-SHOW'|'CANCELLED'` (uppercase, hyphen), backend pakai `confirmed|seated|completed|no_show|cancelled` (lowercase, underscore). Perlu mapping saat wiring, bukan kirim mentah ke API.
- Kategori menu mock POS pakai `FOOD|BEVERAGE|DESSERT|SNACK` hardcoded — backend kategori itu data dinamis dari `GET /admin/menu-categories` (owner yang atur), bukan enum tetap. Tombol kategori harus di-generate dari data fetched, bukan array hardcoded.

---

## 6. UI yang BELUM ADA / belum jadi (daftar TODO — di luar wiring)

Semua ini endpoint backend-nya **sudah siap**, tinggal UI-nya belum dibuat (rendering strategy masing-masing sudah ditentukan di §2 Kategori B):

| # | Halaman | Status UI sekarang | Endpoint backend (siap) | Yang perlu dibangun |
|---|---|---|---|---|
| A | **`/admin/dashboard`** (Analytics) | ❌ **Belum ada page-nya** (sidebar link `#dashboard` mati) | `GET /admin/analytics`, `/analytics/timeline`, `/analytics/menu-performance` | Stat cards (booking hari ini, walk-in, revenue, occupancy, no-show), bar chart booking per jam (**Recharts belum diinstall**), tabel top-5 menu. Owner only. |
| B | **`/admin/menu`** (Menu CRUD) | ❌ **Belum ada page-nya** (sidebar link `#menu` mati) | `GET /admin/menu`, `POST/PATCH/DELETE /admin/menu`, `/admin/menu-categories` CRUD | Tabel menu item (thumbnail/nama/harga/kategori/status/tags). Modal add/edit dgn **image upload** (`multipart/form-data`, field `image`, ≤5MB → backend upload ke Cloudinary). Toggle `available`/`out_of_stock`. Manage kategori. Owner only. |

> **Update:** `/admin/bookings` dan `/admin/pos` awalnya di daftar ini (dulu cuma copy-paste dari page Tables), tapi sudah dibangun jadi UI asli (List/Timeline booking, POS 3-panel) — dipindah ke §5 sebagai wiring, bukan build baru.

**Komponen customer yang ada di PRD tapi belum dibuat:**
- **AI Chat Widget** (FR-CUST-03) — floating widget. → **Blocked**: `POST /ai/chat` backend masih kosong (lihat §7).

## 7. Deferred (backend belum support — jangan dikerjakan dulu)

- **`/admin/settings`** — sidebar punya link tapi **tidak ada endpoint** update restaurant settings di backend. Defer sampai backend bikin `PATCH /admin/settings`.
- **AI Chat Widget** — `src/modules/ai/*` di backend masih placeholder kosong. Defer sampai `POST /ai/chat` diimplementasi.

Keduanya dicatat di sini biar nggak kelupaan; **tidak** dibangun di iterasi ini.

---

## 8. Ringkasan status UI (jawaban langsung: sudah vs belum)

**✅ UI sudah ada — tinggal di-connect (§5):** Landing `/`, Menu `/menu`, Booking `/booking` + Konfirmasi, Login `/admin/login`, Admin layout (sidebar/topbar), Tables `/admin/tables`, Bookings `/admin/bookings`, POS `/admin/pos`, Kitchen `/admin/kitchen`.

**⚠️ UI belum jadi — perlu dibangun (§6):** Dashboard `/admin/dashboard` (belum ada), Menu CRUD `/admin/menu` (belum ada).

**⛔ Diblokir backend — defer (§7):** Settings `/admin/settings`, AI Chat Widget.

**📦 Perlu install dependency baru:** `sonner` (toast, Step 1), `recharts` (chart dashboard, Step 10).

**🔧 Perlu di-refactor (bukan cuma disambung):** `page.tsx` untuk Tables, Bookings, POS, Kitchen, dan `app/(admin)/layout.tsx` saat ini full `'use client'` — harus dipecah jadi Server Component (prefetch, dengan forward cookie manual utk endpoint auth — lihat §2.2 poin 4) + Client Component (interaksi) sesuai §2.

**✅ Sudah diputuskan:** area "VIP" di mock Bookings **dihapus** (backend cuma `indoor`/`outdoor`, prinsip "backend adalah kiblat"). Currency = **USD** (dikonfirmasi user, cocok sama konvensi "integer USD cents" backend).

---

## 9. Verifikasi (checklist regresi penuh — §1 Step 12)

1. Jalankan backend: `cd backend && npm run dev` (port 4000, pastikan DB Neon + seed staff sudah ada).
2. Jalankan frontend: `cd frontend && npm run dev` (port 3000). Pastikan `.env.local` terisi.
3. **Booking flow (public):** buka `/booking`, submit booking valid → cek muncul di `/booking/konfirmasi` dengan `booking_code` real; cek row baru masuk `GET /admin/bookings`.
4. **Menu:** `/menu` render item dari `GET /menu`, harga tampil benar (sesuai keputusan currency §1 Step 0).
5. **Auth:** login owner di `/admin/login` → redirect ke admin, sidebar tampil sesuai role; login kitchen → cuma bisa akses Kitchen; logout → redirect balik ke login; akses `/admin/tables` tanpa login → ke-redirect.
6. **Tables:** create/edit/delete meja → persist setelah refresh; delete meja terpakai → toast `TABLE_IN_USE`.
7. **Kitchen:** submit order dari POS → muncul di `/admin/kitchen` dalam ≤5s (polling); advance status sampai `served` → order auto-complete, meja balik `available`.
8. Cek console Next.js: **0 hydration mismatch** (NFR-PERF-06) — perhatikan khusus halaman yang baru di-split Server/Client (Tables, Bookings, POS, Kitchen, Admin layout), karena ini paling rawan mismatch.

---

## 10. Checklist Eksekusi Konkret — literally ngapain aja, urut dari atas ke bawah

Ini versi paling konkret dari §1 — centang satu-satu, jangan lompat urutan. Setiap FASE = satu halaman/fitur, selesai + test dulu baru pindah ke FASE berikutnya.

### FASE 0 — Sebelum sentuh kode sama sekali
- [x] `cd backend && npm run dev` — pastikan jalan di `:4000`, tidak error. *(sudah jalan, dikonfirmasi via `curl /health` → 200)*
- [ ] Cek DB ada 1 row `Restaurant` (name, opening_hours, settings.tax_rate/service_charge terisi) dan 3 akun staff seeded (owner/cashier/kitchen). *(belum dicek eksplisit — cek di FASE 2/3 saat test login &amp; booking)*
- [x] **Putuskan** currency (Rupiah atau USD) dan area "VIP" (lihat §1 Step 0) — **currency = USD, dikonfirmasi user**. Terverifikasi juga via `curl /menu`: harga `2500` = $25.00, konsisten data seed (nama menu Inggris, harga masuk akal dalam USD). **Area "VIP" juga sudah diputuskan (14 Juli 2026)**: dihapus, ikut prinsip "backend adalah kiblat" — backend cuma punya `indoor`/`outdoor`.
- [x] `cd frontend && npm install sonner`
- [x] Buat `frontend/.env.local` isi `NEXT_PUBLIC_API_URL=http://localhost:4000`

### FASE 1 — Fondasi (WAJIB duluan, sebelum halaman apa pun disentuh) ✅ SELESAI
- [x] Buat `lib/api-client.ts` (wrapper fetch, base URL, `credentials:'include'`, parse envelope `{success,data}`/`{success,error}`) — **temuan penting:** endpoint auth (`/api/auth/*`) TIDAK ikut envelope ini (dikonfirmasi via curl, `get-session` return raw `null`), jadi `apiFetch` sengaja tidak dipakai untuk auth — auth akan punya fetch mentah sendiri di `lib/auth-client.ts` (FASE 2).
- [x] Buat `lib/query-client.ts` (`getQueryClient()` singleton per-request, pakai `cache()` dari React sesuai pola resmi TanStack SSR guide)
- [x] Buat `app/providers.tsx` (`'use client'`, `QueryClientProvider` + `<Toaster/>` dari sonner)
- [x] Edit `app/layout.tsx` — bungkus `{children}` dengan `<Providers>`, ganti `metadata.title` jadi "Palmdine"
- [x] Buat `types/api.ts` (types: `Booking`, `MenuCategory`, `MenuItem`, `Table`, `Order`, `OrderItem`, `KitchenQueueItem`, `Session`, `Analytics*`, dst.) — semua field digrounding dari response asli `curl /menu`, KECUALI `Session` yang masih tebakan berdasar shape standar better-auth (belum ada akun login untuk verifikasi isi asli) — **wajib diverifikasi ulang saat FASE 2/3** pas ada cookie session asli.
- [ ] Folder `lib/queries/` belum dibuat — sengaja ditunda ke FASE 4 (Menu) saat file pertamanya (`menu.ts`) benar-benar dibutuhkan, biar tidak ada folder kosong tanpa isi.
- [x] **Test:** `npx tsc --noEmit` bersih untuk semua file baru (4 error yang muncul di `tables/page.tsx` &amp; `bookings/page.tsx` adalah bug pre-existing di kode mock, tidak disentuh — akan hilang sendiri saat FASE 6/7 nulis ulang file itu). Dev server (punya user, port 3000) auto-reload `.env.local` dan compile bersih; `/`, `/menu`, `/admin/tables` semua HTTP 200, tampilan tidak berubah.

### FASE 2 — Auth dasar (belum dipasang ke UI, infra doang) ✅ SELESAI
- [x] Buat `lib/auth-client.ts` (`signIn`, `signOut`, `getSession`) — **digrounding pakai curl langsung ke akun seed**, bukan tebakan:
  - `POST /api/auth/sign-in/email` sukses → `{redirect,token,user:{...}}` (raw, tanpa envelope). Gagal (401) → `{code:"INVALID_EMAIL_OR_PASSWORD", message:"..."}` (flat, BEDA dari error shape app biasa yang nested `error.code`/`error.message` — makanya auth pakai error class sendiri `AuthError`, bukan `ApiError`).
  - `GET /api/auth/get-session` → `null` kalau belum login, atau `{session:{...}, user:{...}}` kalau sudah — cocok dengan `Session` type yang dibuat di FASE 1 (subset field yang dipakai semua match field asli, tidak perlu diubah).
  - **⚠️ Temuan penting:** `POST /api/auth/sign-out` (dan sign-in) butuh header `Origin` yang valid (proteksi CSRF better-auth) — curl tanpa header ini gagal `MISSING_OR_NULL_ORIGIN`. Browser otomatis kirim `Origin` di setiap cross-origin fetch, jadi tidak masalah untuk pemakaian nyata di frontend nanti, tapi WAJIB diingat kalau ada yang mau test manual pakai curl/Postman — harus tambah `-H "Origin: http://localhost:3000"`.
- [x] Buat `lib/queries/session.ts` (`sessionQueryOptions()`) — **dimajukan dari FASE 3 ke sini** karena `useSession()` butuh ini biar query key/queryFn sama persis dipakai client hook maupun nanti SSR prefetch (FASE 3), tidak didefinisikan dua kali.
- [x] Buat `hooks/use-session.ts` (`useSession()` pakai TanStack Query, key `['session']`)
- [x] Buat `middleware.ts` — guard semua `/admin/*` kecuali `/admin/login`, pakai regex exclude `/admin/((?!login).*)` (pola resmi Next.js docs), fetch `GET /api/auth/get-session` forward cookie dari request masuk, try/catch redirect ke login kalau backend down (bukan crash 500).
- [x] **Test (end-to-end via curl terhadap dev server beneran, bukan cuma type-check):**
  - Tanpa cookie: `/admin/tables`, `/admin/bookings`, `/admin/pos`, `/admin/kitchen` → semua **307 redirect** ke `/admin/login`. `/admin/login` sendiri → **200**, tidak ke-redirect (tidak infinite loop).
  - Login (`POST /api/auth/sign-in/email` dgn `Origin` header) → dapat cookie session asli → akses `/admin/tables` pakai cookie itu → **200**, middleware meloloskan.
  - `npx tsc --noEmit` bersih (0 error baru, 4 error pre-existing yang sama masih ada di Tables/Bookings, tidak disentuh).

### FASE 3 — Login + Admin Shell (gate wajib sebelum semua halaman admin lain) ✅ SELESAI (dengan 1 catatan verifikasi manual)
- [x] ~~Buat `lib/queries/session.ts`~~ — sudah selesai di FASE 2.
- [x] **Keputusan produk yang ditanyakan ke user duluan** (bukan diasumsikan): redirect setelah login sesuai tugas harian — `owner → /admin/tables`, `cashier → /admin/pos`, `kitchen → /admin/kitchen`.
- [x] Edit `lib/auth-client.ts` + `lib/queries/session.ts` — `getSession()` sekarang terima parameter `cookie?` opsional, dipakai saat prefetch di server (client-side tetap panggil tanpa argumen, browser kirim cookie otomatis lewat `credentials:'include'`).
- [x] Edit `components/admin/auth/AdminLoginForm.tsx` — hapus simulasi role berdasar teks email, ganti jadi `useMutation(signIn)` beneran, redirect pakai tabel `ROLE_LANDING_PAGE` sesuai keputusan di atas, error 401 → toast (Sonner) pakai pesan asli dari `AuthError`.
- [x] Buat `components/shared/AdminShell.tsx` (baru) — isi persis logic lama `app/(admin)/layout.tsx` (mobile sidebar state), dipindah ke sini supaya jadi Client Component terpisah dari Server Component layout.
- [x] Edit `app/(admin)/layout.tsx` — jadi Server Component `async`, forward cookie manual via `(await cookies()).toString()`, `prefetchQuery(sessionQueryOptions(cookieHeader))`, bungkus `<AdminShell>` dengan `<HydrationBoundary>`.
- [x] Edit `components/shared/AdminSidebar.tsx` — hapus "Demo Role Switcher" `useState` + tombol switch role, baca role asli dari `useSession()`. Ganti semua `href="#anchor"` jadi path asli. **Catatan:** kamu sudah lebih dulu menghapus link "System Settings" dari array — aku ikuti, tidak ditambahkan lagi (konsisten dengan Settings yang deferred di §7). Role matrix per-link disamakan ke backend: Dashboard=owner saja; Bookings/Tables/POS/Menu Editor=owner+cashier; Kitchen=owner+kitchen.
- [x] Edit `components/shared/AdminTopbar.tsx` — nama staff dari `useSession()`, tombol Logout → `useMutation(signOut)` → invalidate `['session']` → redirect `/admin/login`.
- [x] **Test — bagian yang BISA diverifikasi tanpa browser (via curl ke dev server beneran, HTML asli yang dikirim server):**
  - Login owner/cashier/kitchen (masing-masing dapat cookie asli) → render `/admin/tables` dengan cookie itu → **teks role muncul benar di HTML** (owner/cashier/kitchen) — bukti prefetch+forward-cookie+hydration di Server Component jalan, tidak ada flash "..." dulu.
  - Sidebar ke-filter tepat sesuai role: owner lihat 6/6 link, cashier lihat 4 (Bookings/Tables/POS/Menu Editor, TANPA Dashboard & Kitchen), kitchen cuma lihat 1 (Kitchen Monitor saja).
  - Log dev server dicek manual: **0 error, 0 hydration mismatch warning** setelah semua request test di atas.
  - `npx tsc --noEmit`: 0 error baru (4 error pre-existing di Tables/Bookings masih sama, belum disentuh).
- [ ] **⚠️ BELUM diverifikasi (perlu kamu coba manual di browser):** `curl` tidak bisa menjalankan JavaScript, jadi 2 hal ini murni client-side logic yang belum bisa aku buktikan sendiri — (1) klik tombol "Authorize & Enter Terminal" beneran redirect ke halaman yang benar per role, (2) klik "Logout Terminal" beneran clear session & balik ke `/admin/login`. Tolong coba: buka `/admin/login`, login pakai salah satu akun seed, lihat kamu mendarat di halaman yang benar, terus klik profile dropdown → Logout, pastikan balik ke login.

### Follow-up di FASE 3: UX error login + rename middleware→proxy

- [x] **Diskusi UX dulu (ditanyakan ke user, bukan diasumsikan):** pesan "Invalid email or password" ditampilkan sebagai **teks kecil di bawah form** (bukan toast lagi khusus untuk login form ini). Zod **tidak** ditambahkan ke form login — form cuma 2 field, `required`+`type="email"` native browser sudah cukup; Zod lebih worth-it dipakai di form kompleks kayak Booking (FASE 5).
- [x] Edit `components/admin/auth/AdminLoginForm.tsx` — hapus `toast.error(...)`, ganti jadi baca langsung dari state mutation TanStack Query (`signInMutation.isError` / `.error`) tanpa `useState` tambahan (state sudah tersedia dari mutation, gak perlu duplikat). Render `<AlertCircle/>` + pesan merah di bawah tombol submit. `signInMutation.reset()` dipanggil di awal `handleSubmit` supaya error lama hilang begitu user coba submit ulang.
- [x] **Temuan tak terduga saat testing:** log dev server ternyata warning "`middleware` file convention is deprecated, pakai `proxy`" — dicek ke docs resmi Next.js (`nextjs.org/docs/messages/middleware-to-proxy`): Next.js 16 rename konvensi `middleware.ts`→`proxy.ts` (fungsi `middleware`→`proxy`), murni rename, behavior sama persis. Sudah diperbaiki: `middleware.ts` dihapus, dibuat `proxy.ts` dengan isi sama, fungsi diganti nama jadi `proxy`.
- [x] **⚠️ Insiden kecil saat rename:** proses hapus-lalu-buat sempat membuat Turbopack mendeteksi KEDUA file ada barengan (race condition sesaat) → dev server kamu yang lagi jalan **crash**. Sudah di-restart (`npm run dev`, kembali di port 3000) dan diverifikasi ulang semuanya normal lagi.
- [x] **Verifikasi ulang penuh setelah restart:** guard proxy masih redirect 307 tanpa login, `/admin/login` tetap 200, halaman publik (`/`, `/menu`) tetap 200, login owner dapat cookie asli → render `/admin/tables` menampilkan role dengan benar, log bersih (0 error/warning termasuk warning proxy sudah hilang), `tsc --noEmit` tetap cuma 4 error pre-existing yang sama (dicek ulang dari direktori yang benar setelah sempat salah run dari `/tmp`).

### Follow-up di FASE 3: Kitchen gak punya jalan keluar (ditemukan user)

**Masalah:** `/admin/kitchen` sengaja tanpa sidebar/topbar (full-screen, distraction-free sesuai PRD) — tapi itu berarti gak ada `AdminTopbar` = gak ada tombol Logout sama sekali. Owner yang juga punya akses ke Kitchen bakal kejebak tanpa jalan balik ke halaman admin lain.

- [x] **Ditanyakan ke user dulu:** header Kitchen dikasih tombol beda per role (Recommended, dipilih) — kitchen cuma liat Logout; owner liat "← Admin" (balik ke `/admin/tables`) + Logout.
- [x] Edit `app/(admin-standalone)/admin/kitchen/page.tsx` — reuse `<header>` yang sudah ada, tambah `useSession()` + `useMutation(signOut)` (pola sama persis kayak `AdminTopbar.tsx`), render kondisional di sisi kanan header.
- [x] `tsc --noEmit`: 0 error baru.
- [ ] **⚠️ Keterbatasan testing yang perlu dicek manual di browser:** tombol "← Admin" untuk owner **tidak muncul saat di-curl** — ini BUKAN bug logic, tapi karena `/admin/kitchen` (grup `(admin-standalone)`) belum punya Server Component layout yang prefetch session (beda dari grup `(admin)` yang sudah prefetch, makanya role langsung kelihatan di HTML awal). Di Kitchen, `useSession()` baru resolve setelah JS jalan di browser (client-side fetch), jadi curl cuma lihat kondisi "belum tau role" di initial HTML. Tombol Logout tetap kelihatan karena gak butuh session. **Sengaja tidak diperbaiki sekarang** — SSR prefetch penuh buat Kitchen memang sudah direncanakan di FASE 9 (Server+Client split), jadi belum worth bikin perubahan arsitektur sekarang buat 1 tombol yang bakal ditulis ulang lagi nanti. Tolong cek manual: login sebagai owner, buka `/admin/kitchen`, pastikan tombol "← Admin" muncul (harusnya langsung muncul karena fetch-nya cepat, cuma gak keliatan di curl).

### FASE 4 — Menu publik (`/menu`) ✅ SELESAI — pakai pola lebih baik dari rencana awal (Suspense streaming)
- [x] **Diskusi arsitektur dulu (ditanyakan user):** apakah pakai pola "server fetch async Server Component + Suspense skeleton" (yang user biasa pakai) vs TanStack Query. Kesimpulan: **bukan either/or** — dipakai `useSuspenseQuery` + `prefetchQuery` yang **TIDAK di-`await`** (`void queryClient.prefetchQuery(...)`) di Server Component, sehingga Next.js stream skeleton duluan lalu konten asli menyusul, TAPI data tetap masuk cache TanStack Query (jadi filter/polling/mutation tetap jalan normal). Ini pola resmi TanStack Query utk Next.js App Router streaming, bukan improvisasi.
- [x] Buat `lib/queries/menu.ts` (`menuQueryOptions()` → `GET /menu`)
- [x] Buat `components/public/menu/MenuSkeleton.tsx` (baru) — skeleton match persis dimensi layout asli (title asli "Recipes" + blok abu-abu utk search/tab/grid) biar gak ada layout shift.
- [x] Edit `app/(public)/menu/page.tsx` — Server Component, `void queryClient.prefetchQuery(...)` (sengaja TANPA `await`), `<HydrationBoundary>` + `<Suspense fallback={<MenuSkeleton/>}>`.
- [x] Edit `components/public/menu/MenuSection.tsx` — `'use client'`, `useSuspenseQuery(menuQueryOptions())` (bukan `useQuery` biasa — versi Suspense-aware), hapus array `menuItems` hardcoded. State: `activeCategoryId` (default `'all'`) + `searchInput` + `debouncedSearch` (300ms, lihat poin debounce di bawah). Filter kategori+search 100% in-memory dari `data` yang sudah di-fetch (tidak ada network request tambahan saat ganti tab/ketik search — dijamin oleh konstruksi kode: `setActiveCategoryId`/`setSearchInput` cuma ubah state lokal, tidak ada pemanggilan `useQuery` baru di situ).
- [x] Edit `components/public/menu/MenuCategory.tsx` — direfactor total jadi **prop-driven** (`categories`, `activeCategoryId`, `onSelect`) bukan lagi punya `useState` sendiri; tab digenerate dari `data` asli (Food/Beverages/Dessert) + tab sintetis "All" di depan, bukan array hardcoded `['Burger','Pizza','Salad','Dessert','Drinks']` lagi.
- [x] **Search pakai debounce** sesuai permintaan: `hooks/use-debounced-value.ts` (baru, generic `useDebouncedValue<T>`) — dibuat sebagai hook reusable (bukan cuma inline di Menu) karena Bookings (FASE 7) & POS (FASE 8) juga butuh search box serupa nanti.
- [x] Tambah `formatUsd()` di `lib/utils.ts` (cents → `$25.00`) — dipakai di sini, akan dipakai ulang di POS/Dashboard/Menu CRUD nanti.
- [x] Harga sesuai keputusan currency (USD) dari FASE 0.
- [x] **Test — dibandingkan langsung ke `curl http://localhost:4000/menu` (ground truth):**
  - HTML dari `/menu` frontend mengandung nama item asli (`Mixed Rice Platter`) dan harga yang benar (`price: 2500` → tampil `$25.00`, sesuai USD).
  - Ke-4 tab kategori muncul dan sesuai data asli: `All`, `Food`, `Beverages`, `Dessert` (bukan hardcoded lagi).
  - Default tab "All" menampilkan tepat 18 item (8 Food + 6 Beverages + 4 Dessert) — flatten logic benar.
  - `npx tsc --noEmit`: 0 error baru (4 error pre-existing yang sama, tidak disentuh).
  - Log dev server: 0 error/warning/hydration-mismatch.
- [ ] **⚠️ Belum diverifikasi manual di browser (butuh JS beneran jalan, curl gak cukup):** apakah skeleton keliatan pas pertama kali buka `/menu` (di local dev biasanya fetch terlalu cepat buat keliatan, coba throttle network di DevTools kalau mau lihat), dan interaksi ketik di search box + klik ganti tab kerasa instan tanpa lag. Filter/search logic-nya sendiri sudah diverifikasi BENAR by construction (baca kode: tidak ada network call di path itu), tapi "kerasa instan" itu perlu dirasain langsung.

### Follow-up FASE 4: Kategori di Landing (FlowingMenu) deep-link ke `/menu?category=X`

**Diskusi dulu (bukan langsung diimplement):** dibahas kapan query params lebih bagus daripada client state — kesimpulan: untuk filter/search **dalam satu halaman** (Menu), client state menang (data kecil, gak ada untungnya round-trip server per keystroke/klik). Tapi untuk **navigasi antar halaman** (Landing → Menu bawa kategori aktif), query params itu **satu-satunya cara yang masuk akal** (state React gak bisa nyebrang antar page load).

- [x] **Dicek dulu ke backend:** `GET /menu?category=Food` match berdasarkan **nama** kategori (case-sensitive), BUKAN `id` (uuid gak match sama sekali) — jadi URL pakai nama asli, gak perlu skema slug terpisah.
- [x] **Ditanya ke user:** sinkronisasi URL dua arah (klik tab di `/menu` juga update URL) — **dipilih ya**, pakai `router.replace()` (bukan `push`) biar gak spam browser history tiap klik.
- [x] **Gap yang ditemukan:** `MenuCategory` model di backend TIDAK punya field foto (cuma `id/name/sort_order/is_active`, dicek langsung dari response API). Sesuai instruksi user: dibikin **hardcode placeholder Unsplash per nama kategori**, khusus dipakai di FlowingMenu doang (bukan di `/menu` yang emang pakai foto asli per-item).
- [x] Buat `components/public/landing-page/flowing-menu-data.ts` (baru) — map `{Food, Beverages, Dessert}` → foto Unsplash yang **di-reuse dari foto item asli** kategori itu sendiri (dicek dulu via curl biar dijamin valid, bukan comot ID Unsplash sembarangan), + fallback generik utk kategori baru yang mungkin ditambah owner nanti (FASE 11 Menu CRUD). `count` di-generate dari jumlah item asli, `link` jadi `/menu?category=<Nama>`.
- [x] Buat `FlowingMenuSkeleton.tsx` + `FlowingMenuSection.tsx` (client wrapper, `useSuspenseQuery`) — pola sama persis kayak Menu (prefetch tanpa `await` + Suspense). **Bonus:** query key-nya sama (`['menu']`) dengan halaman `/menu`, jadi kalau user lanjut dari Landing ke Menu, cache-nya udah ada, gak fetch dua kali.
- [x] Edit `app/page.tsx` (Landing) — pasang prefetch+Suspense, buang import `MENU_CATEGORIES` yang fake.
- [x] **Hapus** `constant/index.ts` — isinya cuma `MENU_CATEGORIES` yang sekarang orphan total (dicek dulu pakai grep, dipastikan gak ada pemakaian lain sebelum dihapus).
- [x] Edit `app/(public)/menu/page.tsx` — jadi `async`, baca `searchParams.category` (Next.js 16 = Promise, di-`await`), diteruskan ke `MenuSection` sebagai prop `initialCategory`. Catatan: jadi `async` gara-gara `await searchParams`, TAPI prefetch query-nya tetap sengaja TIDAK di-`await` — dua hal ini independen, gak saling ganggu pola streaming Suspense-nya.
- [x] Edit `MenuSection.tsx` — terima prop `initialCategory` (nama kategori dari URL), di-resolve ke `category.id` internal pakai lazy initializer `useState(() => ...)` (match case-insensitive by name, fallback ke "All" kalau gak ketemu/gak ada). Tambah `handleSelectCategory` yang update state lokal + `router.replace()` ke URL yang sesuai (kategori spesifik → `?category=Nama`, "All" → balik ke `/menu` polos).
- [x] **Catatan surgical:** ketemu `ScrollReveal` import yang UNUSED di `app/page.tsx` — tapi ini sudah unused SEBELUM editanku (bukan aku yang bikin), jadi sengaja TIDAK dihapus sesuai prinsip "jangan bersihin dead code punya orang lain", cuma dicatat di sini.
- [x] **Verifikasi kuat (HTML asli dari server, bukan asumsi):**
  - Landing (`curl /`) → kategori asli `Food`/`Beverages`/`Dessert` muncul, `Appetizers`/`Salads` (fake lama) hilang total; link `href="/menu?category=Food"` ada; count `(08)` sesuai jumlah item Food asli (8).
  - Deep-link `curl "/menu?category=Dessert"` → tab "Dessert" ke-render dengan class `text-black` (aktif) bukan `text-black/30` (inactive) **di HTML awal dari server, sebelum JS jalan** — dan jumlah item yang tampil tepat 4 (jumlah asli item Dessert), bukan 18 (semua). Ini bukti kuat: deep-link bekerja bahkan tanpa JS, gak cuma "keliatan jalan" doang.
  - `npx tsc --noEmit`: 0 error baru. Log dev server: 0 error/warning/mismatch.
- [ ] **⚠️ Belum diverifikasi manual:** klik tab kategori LANGSUNG di `/menu` (bukan dari deep-link) beneran update URL browser (perlu lihat address bar berubah — curl gak bisa "klik").

### FASE 5 — Booking form + Konfirmasi ✅ SELESAI
- [x] Install `@hookform/resolvers` (baru — jembatan resmi react-hook-form + zod, belum ada di `package.json` sebelumnya; `react-hook-form` & `zod` sendiri sudah ada, tinggal dipakai).
- [x] **Zod v4 (bukan v3!):** dicek langsung ke type definition yang ter-install (`node_modules/zod/v4/core/api.d.ts`), bukan tebakan dari memori — custom error message di top-level schema constructor (`z.enum(values, {...})`) pakai key **`error`**, bukan `message` (yang sudah deprecated tapi masih jalan). Method chain (`.min()`, `.max()`, `.regex()`, `.refine()`) tetap terima string shorthand seperti v3.
- [x] Tambah `CreateBookingResponse` di `types/api.ts`, buat `lib/queries/bookings.ts` (`createBooking()` → `POST /bookings`).
- [x] Tulis ulang `BookingForm.tsx` — `react-hook-form` + zod schema lengkap: `customer_name` (wajib), `customer_phone` (regex `08xxxxxxxx`), `party_size` (`z.coerce.number()` 1-20), `booking_date` (string comparison ke tanggal hari ini — **sengaja bukan `new Date()` comparison**, biar tidak kena bug timezone), `booking_time` (enum dari `TIME_SLOTS`), `area_preference` (enum indoor/outdoor/no_preference). Hapus total `showErrorsSimulate` + tombol "Toggle UI Error Style".
- [x] **Gotcha TypeScript yang ditemukan & diperbaiki:** `z.coerce.number()` bikin tipe INPUT (`unknown`, sebelum coerce) beda dari tipe OUTPUT (`number`, setelah coerce) — `useForm<T>` generic tunggal gak cukup. Fix: pakai 3 generic RHF (dicek langsung ke `node_modules/react-hook-form/dist/useForm.d.ts`) — `useForm<BookingFormInput, unknown, BookingFormOutput>` (`z.input<>` utk form fields, `z.output<>` utk callback `handleSubmit`).
- [x] Submit sukses → bangun query params dari **gabungan** response server (`booking_code`, `table` hasil assignment backend, dll) + nilai form asli (`special_requests` — backend gak echo balik field ini di response, jadi diambil dari `variables` mutation, bukan dari `result`) → `router.push('/booking/konfirmasi?code=...&name=...&...')`.
- [x] Submit gagal → `toast.error()` pakai `ApiError.message` asli dari backend (mis. `422 OUTSIDE_OPERATING_HOURS`, `409 NO_TABLE_AVAILABLE`).
- [x] **Split file konfirmasi** — logic dipindah ke `components/public/booking/BookingConfirmation.tsx` (client, baca `useSearchParams()`), `app/(public)/booking/konfirmasi/page.tsx` jadi Server Component tipis + `<Suspense>` (perlu karena `useSearchParams()` di Next.js App Router butuh Suspense boundary supaya gak jadi hard error pas `next build`, bukan cuma masalah `next dev`).
- [x] **Fallback state** kalau buka `/booking/konfirmasi` tanpa query params sama sekali (bukan dari flow booking) — tampilkan pesan "Belum Ada Reservasi" + link balik ke `/booking`, bukan halaman kosong/error.
- [x] **Add to Calendar beneran** — generate file `.ics` valid (RFC5545 minimal: VCALENDAR/VEVENT, `DTSTART`/`DTEND` dari kombinasi tanggal+jam booking, durasi asumsi 90 menit) via `Blob` + object URL + trigger download, bukan `console.log` lagi.
- [x] **Test end-to-end paling kuat sesi ini** — submit booking ASLI ke backend (`curl POST /bookings` dgn Origin header, bukan simulasi): dapat response asli `booking_code: WB-15072026-001`, `table: {name:"Table 3", area:"indoor"}`. Render `/booking/konfirmasi` dgn query params dari response asli itu → **semua field cocok** (nama, party size, tanggal+jam lokal yang benar, catatan khusus).
- [x] **Bug asli ditemukan & diperbaiki saat testing** (bukan asumsi): nama meja asli dari backend sudah mengandung kata "Table" (`"Table 3"`, beda dari mock admin yang pakai kode singkat `"T-04"`) — kode awal nambahin prefix "Table " lagi di depan sehingga tampil dobel **"Table Table 3"**. Diperbaiki jadi langsung `{table} ({area})`.
- [x] `npx tsc --noEmit`: 0 error baru (4 pre-existing sama). Log dev server bersih. `/booking` render 200, tombol lama sudah hilang.
- [ ] **⚠️ Belum diverifikasi manual di browser:** pesan error inline per-field dari react-hook-form (misal ketik HP format salah → langsung muncul teks merah di bawah field itu tanpa submit) dan toast error kalau backend nolak (422/409) — keduanya murni client-side rendering yang gak bisa disimulasikan curl. Coba: isi form dengan HP salah format, submit, cek pesan error muncul di field yang benar.

### Follow-up FASE 5: audit field form vs `booking.schema.ts` backend (diminta user)

User minta cek ulang: apakah field form udah persis sesuai kebutuhan endpoint (bukan cuma UI-nya kelihatan mirip). Dibaca langsung source code backend `backend/src/modules/booking/booking.schema.ts` (bukan cuma andelin catatan lama), dibandingkan field-per-field dgn payload frontend.

**Hasil audit — 5 dari 7 field sudah pas, 2 field ketemu gap NYATA (bukan gaya UI doang):**

| Field | Backend | Frontend (sebelum fix) | Status |
|---|---|---|---|
| `customer_name` | `.trim().min(1)` | sama | ✅ pas |
| `customer_phone` | regex `08\d{8,11}` | sama persis | ✅ pas |
| `party_size` | `number().int().min(1).max(20)` | `z.coerce.number()` 1-20 | ✅ pas (coerce mastiin jadi number asli sebelum dikirim) |
| `booking_time` | regex `HH:MM` bebas 00:00-23:59 | `z.enum(TIME_SLOTS)` 17:00-22:30/30menit | ✅ subset valid (pembatasan UX resto, bukan mismatch) |
| `area_preference` | **optional** | **required** di form | ✅ lebih ketat dari BE, tetap valid dikirim (bukan gap, keputusan UX pre-existing) |
| `booking_date` | divalidasi vs `todayInJakarta()` — **timezone Asia/Jakarta eksplisit** | pakai `new Date()` timezone lokal browser | ❌ **GAP**: bisa gak sinkron kalau browser user beda timezone dari Jakarta |
| `special_requests` | `.trim().min(1).optional()` — boleh absen, TAPI kalau ada gak boleh string kosong | `.trim().optional()` — kirim `""` kalau textarea dibiarkan kosong | ❌ **GAP nyata, dibuktikan lewat curl**: kirim `special_requests:""` → backend tolak `400 INVALID_INPUT "Too small: expected string to have >=1 characters"` |

**Perbaikan:**
- [x] `getTodayDateString()` diganti pakai `new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Jakarta'})` — **sama persis** dengan `todayInJakarta()` di backend, supaya validasi "gak boleh masa lalu" selalu sinkron FE↔BE di timezone manapun user berada. Diverifikasi via `node -e` → output `2026-07-14`, cocok sama jam WIB asli.
- [x] `special_requests` ditambah `.transform((value) => (value ? value : undefined))` — textarea kosong sekarang jadi `undefined`, dan `JSON.stringify` otomatis MENGHILANGKAN key yang value-nya `undefined` dari body request, jadi field itu gak ikut terkirim sama sekali (bukan terkirim sebagai `""`) kalau user gak isi.
- [x] **Dibuktikan langsung ke backend (curl), bukan cuma baca kode:** kirim `special_requests:""` → `400 Too small: expected string to have >=1 characters` (bug ke-reproduce persis kayak dugaan). Kirim TANPA field itu sama sekali → `201` sukses. Fix di frontend membuat behaviour form sekarang selalu masuk jalur yang kedua.
- [x] **Kesimpulan gak ada field kurang/lebih**: 7 field yang dikirim frontend (`customer_name`, `customer_phone`, `party_size`, `booking_date`, `booking_time`, `area_preference`, `special_requests`) persis sama dengan 7 field yang didefinisikan backend — tidak ada field asing yang dikirim, tidak ada field wajib yang kelewat.
- [x] `npx tsc --noEmit`: 0 error baru (4 pre-existing sama).

### FASE 6 — Tables (`/admin/tables`) ✅ SELESAI
- [x] Bedah kontrak backend dulu (`table.{schema,service,controller,routes}.ts`) vs UI mock, didiskusikan ke user sebelum coding: panel "Assignment History" **dihapus total** (backend gak punya endpoint histori per-meja), status form edit **cuma expose `available`/`maintenance`** (occupied di-toggle order flow, reserved dihitung live — bukan di-set manual), `sort_order` **disembunyikan** (kirim default: 0 saat create, gak dikirim saat edit), tombol write **disembunyikan total** utk cashier (bukan cuma disabled).
- [x] Tambah `CreateTableInput`/`UpdateTableInput` di `types/api.ts` (mirror `table.schema.ts`, snake_case).
- [x] Buat `lib/queries/tables.ts` (`tablesQueryOptions(cookie?)`, `createTable`, `updateTable`, `deleteTable`) — reuse `apiFetch` yang udah terima `headers`, gak perlu ubah `api-client.ts`.
- [x] Split `app/(admin)/admin/tables/page.tsx` → Server Component `async`, forward cookie via `(await cookies()).toString()`.
- [x] Buat `components/admin/tables/TablesBoard.tsx` (`'use client'`) — pindahin SEMUA isi page.tsx lama ke sini + Create dialog baru (belum ada di mock) + tombol Delete baru (belum ada di mock) + edit field `name` (dialog lama cuma capacity/area/status). Hapus area `VIP` dari filter & select (backend cuma indoor/outdoor). Mapping `nama→name`, `kapasitas→capacity`, enum UPPERCASE→lowercase.
- [x] Buat `components/admin/tables/TablesSkeleton.tsx` (baru, pola sama `MenuSkeleton.tsx`).
- [x] `useSuspenseQuery(tablesQueryOptions())` + `refetchInterval: 12000` (polling).
- [x] Dialog create/edit → `useMutation` → `invalidateQueries(['tables'])` + toast sukses (Sonner, pola sama `BookingForm.tsx`).
- [x] Delete → `window.confirm` dulu (belum ada komponen confirm dialog di `ui/`, gak worth bikin baru buat 1 pemakaian) → `useMutation` → handle `409 TABLE_IN_USE` via `toast.error(ApiError.message)` asli dari backend, bukan silent fail.
- [x] Role check: `useSession()` → `role === 'owner'` gate render tombol Add Table/Edit/Delete (disembunyikan total, bukan disabled, sesuai keputusan user).
- [x] **Gotcha `@base-ui/react/dialog`**: bukan Radix — `DialogTrigger` gak nerima prop `asChild`, pakai `render={<button .../>}` (ketauan dari `tsc` error, diverifikasi ke `components/ui/dialog.tsx` yang emang pakai `@base-ui/react/dialog`, bukan `@radix-ui`).
- [x] **🐛 Bug arsitektur #1 ditemukan & diperbaiki lewat testing curl** (bukan cuma `tsc`): page.tsx awalnya niru pola streaming FASE 4 Menu (`void queryClient.prefetchQuery(...)` **tanpa await**) — tapi pola itu cuma aman utk endpoint **publik**. Utk endpoint ber-auth (`/admin/tables`), prefetch yang masih `pending` (belum resolve) saat `dehydrate()` dipanggil bikin query itu **KELUAR dari hydrated state** (default TanStack Query `shouldDehydrateQuery` cuma include status `success`) — akibatnya `TablesBoard` (client component, tapi tetap di-*render* di server buat initial HTML) jalanin `useSuspenseQuery`-nya sendiri **tanpa cookie** (`credentials:'include'` no-op di Node fetch, cuma berlaku di browser asli beneran) → backend `401 Session is invalid or has expired` → React diam-diam fallback ke client-only rendering (gak crash, tapi HTML dari server **selamanya cuma skeleton**, ketauan dari curl berulang kali return ukuran file identik tanpa data asli, ketemu stack trace error di RSC payload pas di-grep manual). **Fix:** ganti jadi `await queryClient.prefetchQuery(...)` (pola sama persis kayak `sessionQueryOptions` di `(admin)/layout.tsx`).
- [x] **🐛 Bug arsitektur #2 ditemukan user sendiri (login kitchen, buka `/admin/tables`) & diperbaiki**: fix #1 di atas ternyata belum cukup buat kasus role SALAH mengakses page (kitchen bukan `owner`/`cashier`). Root cause: **`queryClient.prefetchQuery()` didesain sengaja MENELAN error** — source `@tanstack/query-core`: `prefetchQuery(options) { return this.fetchQuery(options).then(noop).catch(noop) }` — jadi `await` tetap gak pernah reject walau fetch di baliknya beneran gagal (backend correctly return `403 FORBIDDEN` utk kitchen, dibuktikan langsung ke backend). Karena gak reject, query itu berstatus `error` (bukan `pending` ATAU `success`) — tetep KELUAR dari `dehydrate()` (yang cuma include `success`) — jadi client component tetep re-fetch sendiri tanpa cookie pas SSR, muncul **401 "Session is invalid"** yang MENYESATKAN (padahal akar masalahnya 403 role, bukan cookie). **Fix asli:** ganti `prefetchQuery`→**`fetchQuery`** (versi yang BENERAN reject) dibungkus `try/catch` di `page.tsx`, render UI **"Access Denied"** (pesan asli dari `ApiError`, pola visual sama `BookingConfirmation.tsx` "Belum Ada Reservasi") + link balik ke landing page sesuai role (baca session dari `queryClient.getQueryData(['session'])`, udah ke-dehydrate duluan oleh layout). Extract `ROLE_LANDING_PAGE` (tadinya inline di `AdminLoginForm.tsx`) ke `lib/role-landing.ts` biar reusable. **Pelajaran buat FASE 7-11 (SEMUA halaman admin ber-auth)**: (1) pola "void prefetch tanpa await" cuma valid utk endpoint publik (`/menu`); (2) **`prefetchQuery` gak cukup meski di-`await`** — kalau endpoint punya role restriction yang mungkin ke-trigger (kitchen buka Bookings/POS/Dashboard, cashier buka Kitchen, dst — cek matrix role per endpoint di §Kontrak Backend), WAJIB pakai `fetchQuery` + `try/catch` + render Access Denied, bukan `prefetchQuery` polos.
- [x] **Test end-to-end kuat (curl, bukan cuma `tsc`):**
  - Login owner asli → render `/admin/tables` dgn cookie itu → **HTML dari server** (bukan JS browser) tampilkan seluruh 20 meja asli (`Table 1`...`Table 20`, area/capacity/status match persis `GET /admin/tables` via curl langsung) + tombol "Add Table" muncul. 0 jejak "Session is invalid", 0 "Assignment History".
  - Login cashier asli → render sama → data grid tetap kebaca, tapi tombol "Add Table" **0 kemunculan** di HTML (role gate jalan sisi server, bukan cuma disembunyikan CSS).
  - `POST /admin/tables` (owner) → create sukses, default `status:available`/`sort_order:0` kepakai kalau gak dikirim. `PATCH` → update `name`+`capacity`+`status:maintenance` sukses. `DELETE` meja baru (gak ada histori) → `204`. `DELETE` meja yang punya booking asli dari FASE 5 (`Table 3`) → `409 TABLE_IN_USE` dgn pesan persis yang bakal ditampilin toast.
  - Render ulang setelah semua test mutation → tetap 20 meja (meja test udah kehapus, Table 3 masih ada karena delete-nya sengaja gagal) — konsisten dgn ground truth backend.
  - `npx tsc --noEmit`: 0 error baru (2 error pre-existing di `bookings/page.tsx` — bukan 4 lagi, `tables/page.tsx` yang lama udah gak ada — masih sama, belum disentuh, bakal ilang sendiri di FASE 7). `npx eslint`: bersih.
  - **Setelah fix bug #2**: login kitchen asli → render `/admin/tables` → "Access Denied" + pesan asli backend + link balik ke `/admin/kitchen`, 0 crash "Switched to client rendering". Re-cek owner & cashier masih normal (grid tampil, role gate Add Table masih benar) — gak ada regresi dari fix ini.
  - **Catatan:** pas re-cek ini, jumlah meja kebaca 19 (bukan 20) — dicek by ID langsung ke backend, `Table 20` udah `TABLE_NOT_FOUND`. Kemungkinan besar user sendiri yang testing tombol Delete baru (bukan dari testing sesi ini — semua delete test di sesi ini pakai ID lain yang udah diverifikasi cocok). Data gak disentuh/direstore, dicatat aja di sini.
- [ ] **⚠️ Belum diverifikasi manual di browser** (curl gak bisa klik dialog/tombol): buka Create dialog isi form submit; buka Edit dialog ganti field submit; klik Delete + confirm browser popup; filter area/status di UI beneran filter in-memory (cek Network tab gak ada request baru); polling ~12 detik kelihatan update tanpa refresh manual.

### Follow-up FASE 6: role-based route guard (belum ada "middleware proper", ditemukan user, 15 Juli 2026) ✅ SELESAI

**Masalah:** bug #2 di atas (kitchen buka Tables, crash) kebuka gap yang lebih besar — `proxy.ts` cuma cek **login atau nggak**, sama sekali gak cek **role**. Sidebar cuma nyembunyiin link (kosmetik), bukan proteksi asli. Tanpa page-level guard (yang baru ada di Tables), role manapun bisa buka URL `/admin/*` manapun langsung dan cuma ketauan salah pas nyoba fetch data.

**Diskusi dulu ke user** (matrix baru diminta): Owner = semua (+Settings), Cashier = POS/Bookings/Menu(view), Kitchen = Kitchen doang. Ditemukan 2 konflik nyata vs kondisi sekarang, diklarifikasi ke user sebelum coding:
1. **Tables buat cashier**: backend `GET /admin/tables` sengaja masih izinin cashier (dipakai POS nanti buat floor plan), tapi matrix baru gak nyebut Tables buat cashier sama sekali. **Diputuskan**: yang ditutup cuma HALAMAN `/admin/tables` (CRUD standalone), endpoint API-nya tetap `owner+cashier` di backend (gak diubah) — POS tetap bisa pakai data yang sama.
2. **Settings**: masuk matrix Owner tapi backend-nya emang belum pernah dibangun (`PATCH /admin/settings` gak ada, sengaja di-defer). **Diputuskan**: tetap defer, dicatat di matrix (reserved, `owner` only) buat kesiapan nanti, TAPI gak ada halaman/link baru dibangun sekarang.
3. **"Add menu / list menu"**: diklarifikasi maksudnya FASE 11 (satu halaman `/admin/menu`, owner full CRUD + cashier read-only) — sudah sesuai rencana awal, gak berubah, cuma konfirmasi paham yang sama.

**Implementasi:**
- [x] Buat `lib/admin-routes.ts` (baru) — `ADMIN_ROUTE_ROLES` (path segment → `StaffRole[]`) + helper `getAdminRouteRoles(path)`. **Satu sumber kebenaran** dipakai `proxy.ts` DAN `AdminSidebar.tsx`, biar gak ada 2 daftar role yang bisa gak sinkron (sebelumnya sidebar punya array `roles` sendiri per link, terpisah dari backend `requireRole`).
- [x] Edit `proxy.ts` — setelah session valid, cocokkan `request.nextUrl.pathname` ke `getAdminRouteRoles()`; kalau role gak termasuk → `redirect` ke `ROLE_LANDING_PAGE[role]` (dari `lib/role-landing.ts`, hasil extract pas fix bug #2). Ini nutup akses **sebelum** halaman/render/fetch apapun jalan — beda dari pola `fetchQuery+catch+Access Denied` di Tables yang baru ketauan SETELAH nyoba fetch.
- [x] Edit `AdminSidebar.tsx` — buang array `roles` hardcoded per link, filter pakai `getAdminRouteRoles(link.href)` dari matrix yang sama.
- [x] **Backend TIDAK diubah** — `table.routes.ts` GET tetap `owner+cashier` (keputusan #1 di atas, biar POS nanti gak kebawa rusak).
- [x] Halaman "Access Denied" di Tables (dari bug #2) **dipertahankan** sebagai lapisan cadangan (defense-in-depth) — sekarang jarang ke-trigger karena proxy udah nutup duluan, tapi tetap valid buat edge case (race condition, mutation ditolak backend, dll).
- [x] **Test end-to-end (curl, matrix 6 route × 3 role = 18 kombinasi)**: fresh login ketiga role, cek tiap route.
  - Tables: owner 200, cashier→307`/admin/pos`, kitchen→307`/admin/kitchen` ✅
  - Bookings: owner 200, cashier 200, kitchen→307`/admin/kitchen` ✅
  - POS: owner 200, cashier 200, kitchen→307`/admin/kitchen` ✅
  - Kitchen: owner 200, cashier→307`/admin/pos`, kitchen 200 ✅
  - Dashboard (halaman belum dibangun, FASE 10): owner 404 (bukan diblokir — cuma gak ada page-nya), cashier→307, kitchen→307 ✅
  - Menu (halaman belum dibangun, FASE 11): owner 404, cashier 404 (keduanya cuma "belum ada page", BUKAN diblokir), kitchen→307 ✅
  - Sidebar: owner lihat 6/6 link; cashier lihat tepat 3 (Bookings/POS/Menu Editor, Tables & Dashboard hilang); Kitchen link gak dicek ulang (udah confirmed FASE 3, gak berubah).
  - `npx tsc --noEmit`: 0 error baru (2 pre-existing sama). `npx eslint`: bersih di semua file yang disentuh.
- [ ] **⚠️ Belum diverifikasi manual di browser**: redirect beneran keliatan smooth di address bar (bukan cuma status code via curl), dan gak ada redirect loop kalau role user berubah di tengah sesi (edge case jarang, misal role diubah admin lain saat masih login).

### Follow-up ke-2 dari role guard (15 Juli 2026): revisi matrix Tables + gap "logged-in masih bisa buka /admin/login" ✅ SELESAI

**Diskusi dulu** (diminta user, bukan langsung diasumsikan): dibahas apakah matrix "Tables cuma owner" itu ideal secara operasional. Ketemu 2 celah nyata: (1) cashier gak bisa toggle status meja manual (mis. tandain `maintenance` pas ada meja rusak, harus nunggu owner) kalau Tables ditutup total; (2) menu view-only + kitchen gak lihat booking punya potensi friction juga tapi didiskusikan dulu, belum diputuskan berubah sekarang. **Hasil keputusan user**: buka akses **halaman** Tables buat cashier (kembali kayak semula) — tombol write (Add/Edit/Delete) tetap tersembunyi otomatis karena `TablesBoard.tsx` gate berdasar `isOwner` (dibangun FASE 6), dan backend `POST/PATCH/DELETE /admin/tables` tetap `owner`-only — jadi cashier cuma dapat READ, konsisten sama kontrak backend, gak ada perubahan lain diperlukan.

**Gap ke-2 ditemukan user**: user yang UDAH login masih bisa buka `/admin/login` manual (harusnya di-redirect balik ke halaman kerjanya, bukan ditawarin login ulang). Akar masalah: `proxy.ts` matcher lama (`/admin/((?!login).*)`) sengaja EXCLUDE `/admin/login` dari matcher — jadi `proxy()` gak pernah jalan sama sekali di route itu, gak ada logic buat cek "udah login apa belum" di situ.

**Fix:**
- [x] `lib/admin-routes.ts` — `tables: ['owner']` → **`tables: ['owner', 'cashier']`**.
- [x] `proxy.ts` — matcher diperluas jadi `/admin/:path*` (dulu exclude login). Logic direstruktur: cek `pathname === '/admin/login'` duluan — kalau session ADA → redirect ke `ROLE_LANDING_PAGE[role]` (gak boleh balik ke login), kalau session gak ada → `next()` (baru boleh liat form login). Kalau BUKAN halaman login: fetch session gagal/gak ada → redirect ke login (behavior lama gak berubah), ada tapi role gak sesuai matrix → redirect ke landing page role itu (behavior lama gak berubah).
- [x] **Test (curl, fresh login ketiga role)**:
  - `/admin/tables`: owner 200, **cashier 200 (baru, sebelumnya 307)**, kitchen tetap 307→`/admin/kitchen` (gak berubah).
  - `/admin/login` udah login: owner→307`/admin/tables`, cashier→307`/admin/pos`, kitchen→307`/admin/kitchen`. Belum login: `/admin/login` tetap 200 (gak infinite redirect).
  - Sidebar cashier: "Tables Management" muncul lagi (1×), grid 19 meja kebaca, tombol "Add Table" tetap 0 kemunculan (write masih ke-gate role owner, gak ada regresi).
  - `npx tsc --noEmit` & `npx eslint`: bersih (2 error pre-existing sama, gak berubah).

### FASE 7 — Bookings admin (`/admin/bookings`) ✅ SELESAI

**Bedah kontrak dulu** (`booking.{schema,controller,service}.ts`) vs mock: `types/api.ts` `Booking` udah 100% match DTO dari FASE 1, gak perlu diubah. Didiskusikan ke user 3 keputusan sebelum coding:
1. **Tombol "Edit" dihapus total** — backend `PATCH /admin/bookings/:id` cuma terima `{status}`, gak ada endpoint edit detail (nama/HP/tanggal/jam). Ganti slot itu jadi tombol **"Mark Completed"** (poin 3).
2. **`special_requests` & histori customer (`total_visits`/`no_show_count`) ditambahkan ke UI** — sebelumnya 0% ditampilkan meski ada di response. Taruh sebagai badge kecil inline (icon+tooltip buat note, badge biru "Nx visit"/badge merah "Nx no-show") di List view (table+card) — **sengaja gak dipasang di Timeline** (kartu Timeline kecil, buat scan cepat bukan detail).
3. **Tombol "Mark Completed" ditambah** — status `completed` ada di enum backend (dan men-trigger `total_visits++` di backend), tapi mock gak punya aksi buat itu.

**Implementasi:**
- [x] Extend `lib/queries/bookings.ts` — `BookingsFilters` + `bookingsQueryOptions(filters, cookie?)` (query key eksplisit array `['bookings', date, status, area, search]`, bukan object langsung, biar hash konsisten) + `updateBookingStatus(id, status)`.
- [x] `app/(admin)/admin/bookings/page.tsx` — ditulis ulang total jadi Server Component, `fetchQuery`+`try/catch`+Access Denied (pola sama Tables FASE 6, endpoint ber-auth), default filter `date=hari ini` (Jakarta, fungsi lokal sama persis `BookingForm.tsx`).
- [x] `components/admin/bookings/BookingsBoard.tsx` (baru) — List+Timeline UI dipindah verbatim (classNames dipertahankan persis, termasuk hybrid fixed-size+vw yang emang gaya asli file ini, BEDA dari Tables yang full-vw), filter jadi query params server (bukan `.filter()` in-memory) via `useSuspenseQuery`+`refetchInterval:12000`, `useMutation(updateBookingStatus)`→invalidate `['bookings']`. Area "VIP" dibuang dari filter+timeline zone (`TIMELINE_AREAS = ['indoor','outdoor']`). Status enum: UI langsung pakai value backend (`confirmed|seated|completed|no_show|cancelled`), badge label di-hardcode Capitalized (bukan lagi uppercase mock lama).
- [x] `components/admin/bookings/BookingsSkeleton.tsx` (baru).
- [x] Role: owner+cashier akses+aksi sama persis (gak ada gating beda kayak Tables — backend emang satu level buat keduanya).
- [x] **Test end-to-end (curl + data asli, bukan cuma tsc):**
  - Bikin 2 booking test manual (`WB-14072026-001/002`, customer sama "Rina Wijaya") lewat `POST /bookings` — satu dikasih `special_requests`, satu lagi di-PATCH `completed` duluan (nge-trigger `customer.total_visits`→1) baru booking kedua dibikin biar histori kebaca.
  - Render `/admin/bookings` (owner) → kedua booking muncul, badge **"Note"** (tooltip isi special_requests) tampil cuma di booking yang ada catatannya, badge **"1x visit"** tampil di KEDUA booking (customer sama), badge status Completed/Confirmed benar — di mobile card DAN desktop table.
  - Cashier → akses sama, data sama. Kitchen → tetap diblokir proxy (redirect `/admin/kitchen`), gak berubah dari role guard sebelumnya.
  - `PATCH` status `no_show` manual → `no_show_count` **sengaja TETAP 0** (bukan bug — cocok sama catatan `context.md`: no_show_count cuma naik lewat cron, bukan PATCH manual).
  - `PATCH` status invalid → `400 INVALID_INPUT` dengan pesan asli, bakal ke-toast lewat `ApiError`.
  - `npx tsc --noEmit`: **0 error** (2 error pre-existing di file lama ilang sendiri karena ditulis ulang total). `npx eslint` project-wide: bersih di semua file yang disentuh, sisa error/warning cuma di file lain yang emang udah gak disentuh dari awal.
- [ ] **⚠️ Belum diverifikasi manual di browser**: ganti tanggal/filter/search beneran trigger request baru (cek Network tab); klik aksi status dari dropdown desktop & tombol mobile card; toggle List↔Timeline. 2 booking test (`Rina Wijaya`) sengaja DIBIARKAN di database (bukan dihapus) biar bisa langsung dicoba lihat badge Note/visit di browser asli.

### FASE 8 — POS (`/admin/pos`) ✅ SELESAI

**Bedah kontrak dulu** (`order.{schema,controller,service}.ts`) vs mock — scope-nya lebih besar dari fase lain karena checkout ikut masuk. `types/api.ts` `Order`/`OrderItem` udah match dari FASE 1, tambah `OrderBill`/`OrderBillItem` baru (shape beda dari `Order`, ada formatted string per field). Didiskusikan ke user 4 keputusan sebelum coding:
1. **Meja OCCUPIED diklik lagi → selalu bikin Order baru** (backend emang gak punya endpoint "tambah item ke order yang udah ada", tiap submit = order terpisah).
2. **Checkout (Lihat Bill + Tandai Lunas) masuk scope sekarang** — bukan fase terpisah. Dipicu dari tombol **"🧾 Bill"** kecil di kartu meja occupied (terpisah dari klik utama pilih-meja), buka Dialog checkout.
3. **Cart preview pakai estimasi tax 10%/service 5% hardcode** (gak ada endpoint publik buat baca `restaurant.settings` asli) — dikonfirmasi lewat testing curl beneran: order asli (`subtotal:5000`) balikin `tax:500, service_charge:250` — **persis** sama estimasi hardcode, jadi asumsi ini valid buat seed data sekarang.
4. **Status meja**: `reserved` boleh dipilih buat order, `maintenance` di-disable (gak bisa diklik).

**Implementasi:**
- [x] Tambah `OrderBill`/`OrderBillItem` di `types/api.ts` (mirror `getOrderBill()` response).
- [x] Buat `lib/queries/orders.ts` — `createOrder()`, `activeOrdersQueryOptions(tableId)` (`GET /admin/orders?table_id=&status=active`), `orderBillQueryOptions(orderId)`, `updateOrderPaymentStatus(id, status)`.
- [x] `app/(admin)/admin/pos/page.tsx` — Server Component, **`Promise.all([fetchQuery(tables), fetchQuery(menu)])`** paralel + `try/catch`+Access Denied (Tables ber-auth, Menu public — tetap di-`fetchQuery` juga biar konsisten satu `Promise.all`, gak ada yang ke-swallow diam-diam kalau salah satu gagal).
- [x] `components/admin/pos/POSBoard.tsx` (baru) — 3-panel UI dipindah, styling dipertahankan verbatim dari mock. Floor plan: 4 badge status asli (`available`/`reserved`/`occupied`/`maintenance`, bukan cuma AVAILABLE/OCCUPIED binary), `maintenance` disabled (`cursor-not-allowed`, onClick no-op). Kartu occupied dapat tombol "Bill" kecil (nested, makanya card wrapper diganti `<div onClick>` bukan `<button>` lagi — konsisten sama pola `TablesBoard.tsx`, gak valid HTML kalau button di dalam button). Kategori digenerate dari `GET /menu` (`ALL_CATEGORY_ID` + dynamic categories), item `out_of_stock` di-disable (opacity+cursor-not-allowed) — field ini emang ke-return endpoint publik (dicek langsung ke `menu.service.ts`, cuma filter `deletedAt`, gak filter `status`). Cart tetap `useState` lokal murni. Tambah input opsional "No. HP Pelanggan". `notes` per item: kosong → di-omit dari payload (pola sama fix `special_requests` FASE 5). Checkout Dialog: `useQuery(activeOrdersQueryOptions)` (bukan Suspense — client-only interaction, `enabled` gate), expand per order lazy-fetch `orderBillQueryOptions`, tombol "Tandai Lunas" → `useMutation(updateOrderPaymentStatus)`.
- [x] `components/admin/pos/POSSkeleton.tsx` (baru).
- [x] **Gotcha ordering**: `handleSubmitToKitchen` awalnya dipakai di `useEffect` (keyboard shortcut) SEBELUM dideklarasikan (warisan struktur mock asli) — ketauan dari `eslint` (`react-hooks/immutability`), diperbaiki dengan reorder deklarasi (pindah `useEffect` ke bawah semua handler), gak ubah logic.
- [x] **Test end-to-end kuat (curl + order asli, bukan cuma tsc):**
  - Role guard: owner 200, cashier 200, kitchen 307→`/admin/kitchen` — konsisten matrix.
  - Render `/admin/pos` (owner & cashier) → 19 meja asli + 4 kategori menu asli (`All/Food/Beverages/Dessert`) muncul di HTML, 0 error.
  - **`POST /admin/orders` asli** (table_id+customer_phone+items, payload PERSIS sama `createOrder()`) → sukses, `subtotal:5000/tax:500/service_charge:250/total:5750` — **tax & service charge match 100% sama estimasi hardcode FE**. Table otomatis `occupied` (dicek ulang `GET /admin/tables`).
  - Render ulang `/admin/pos` → Table 1 tampil badge merah "Occupied" + tombol "Bill" muncul di HTML.
  - **Checkout flow full**: `GET .../orders?table_id=&status=active` (persis `activeOrdersQueryOptions`) → return order yang baru dibuat. `GET .../bill` (persis `orderBillQueryOptions`) → formatted breakdown lengkap. `PATCH payment_status:paid` (persis `updateOrderPaymentStatus`) → sukses.
  - `npx tsc --noEmit`: **0 error**. `npx eslint`: 0 error di semua file yang disentuh (sisa error project-wide di file lain yang emang belum disentuh dari awal — `Navbar.tsx`, `carousel.tsx`, `RestaurantEvents.tsx`).
- [ ] **⚠️ Belum diverifikasi manual di browser**: klik meja → pindah ke panel Menu (mobile); tambah item ke cart + keyboard shortcut (angka 1-9 ganti qty, Enter submit); buka dialog Checkout dari tombol Bill; toggle 3 panel mobile (Tables/Menu/Summary) beneran switch.

### FASE 9 — Kitchen (`/admin/kitchen`) ✅ SELESAI

**Bedah kontrak dulu** (`kitchen.{schema,controller,service}.ts` + cross-check `backend.md` FR-KIT-01/02) — nemu **2 mismatch struktural besar** antara mock dan backend, didiskusikan ke user sebelum coding:
1. **Item yang di-mark `ready` HILANG dari `GET /admin/kitchen-queue`** — disengaja sesuai PRD (`KITCHEN_QUEUE_STATUSES = ['pending','cooking']` doang di `kitchen.service.ts`). Backend gak validasi urutan transisi (`PATCH` bisa langsung ke status manapun). **Diputuskan**: UI cuma 2 tahap (Pending→Cooking→**langsung Served**, skip `ready` sepenuhnya dari UI) — item hilang dari tiket begitu ditekan "Mark Served", konsisten sama cara backend kerja, gak ada state `ready` yang aneh ilang sendiri pas poll berikutnya.
2. **Granularitas mock SALAH TOTAL** — mock nganggap 1 order = 1 status buat semua item-nya. Backend track status **PER ITEM** independen (`OrderItem.status`). **Diputuskan**: kartu tiket tetap dikelompokkan per order (pakai `item.order.id`), tapi **tombol advance status per item** di dalamnya — item dalam 1 order bisa beda tahap (misal 1 udah cooking, 1 lagi masih pending).
3. Mock nampilin "#004" (order number fiktif, gak ada padanannya di backend — Order gak punya kode manusiawi kayak Booking) — **diganti pakai nama meja** (`order.table.name`) sebagai identifier utama.
4. Foto menu item di tiket — **skip**, teks doang (KDS biasanya teks-only biar cepet di-scan).

**Implementasi:**
- [x] Buat `lib/queries/kitchen.ts` — `kitchenQueueQueryOptions(cookie?)`, `updateOrderItemStatus(id, status)`.
- [x] Split `app/(admin-standalone)/admin/kitchen/page.tsx` → Server Component, prefetch `session` (grup `(admin-standalone)` gak lewat `(admin)/layout.tsx`, jadi butuh prefetch sendiri — ini yang benerin temuan follow-up FASE 3 dulu soal tombol "← Admin" gak keliatan di curl) + `fetchQuery`+`try/catch` kitchen-queue (Access Denied fallback versi simpel, gak pakai `AdminShell`).
- [x] Buat `components/admin/kitchen/KitchenBoard.tsx` (`'use client'`) — `groupByOrder()` helper (flat `KitchenQueueItem[]` → tiket per order), tiap item render status badge + tombol sendiri (`pending`→"Start Cooking", `cooking`→"Mark Served"). `useSuspenseQuery`+`refetchInterval:4000` (dalam rentang NFR-PERF-02 backend, freshness ≤5 detik). `useMutation` **optimistic**: `onMutate` update cache lokal langsung (hapus item kalau `served`, ubah status kalau `cooking`) sebelum response balik, rollback di `onError`. `onSettled` invalidate `['kitchen-queue']` **dan** `['tables']` (serve item terakhir bisa nge-trigger table balik `available`). Header Admin/Logout direuse persis dari mock (`useSession`+`signOut` mutation, link "← Admin" cuma buat `role==='owner'`). `ElapsedTimer` component dipertahankan verbatim dari mock, sekarang pakai `order.created_at` asli.
- [x] Buat `components/admin/kitchen/KitchenSkeleton.tsx` (baru).
- [x] **Test end-to-end kuat (curl + full loop asli, bukan cuma tsc):**
  - Role guard: owner 200, kitchen 200, cashier 307→`/admin/pos` — konsisten matrix.
  - Ground truth `GET /admin/kitchen-queue` nemu 2 order asli nyisa dari testing FASE 8 (1 dari testing-ku, 1 lagi dari testing user sendiri di POS — bonus test data multi-item satu order).
  - Render `/admin/kitchen` (owner & kitchen) → kedua tiket (Table 1, Table 4) muncul dgn item+notes benar, 3 tombol "Start Cooking" (3 item pending total). Kitchen role: 0 tombol "Admin" (cuma owner yang lihat).
  - **Full loop milestone**: `PATCH` 2 item di Table 4 (order isi 2 item beda) satu-satu — item pertama `served` duluan, order **masih `active`**/meja **masih `occupied`** (item kedua belum served, sesuai `completeOrderIfAllItemsServed` yang cek SEMUA item). Item kedua `served` → order **otomatis `completed`**, **Table 4 balik `available`**, tiket Table 4 **hilang dari queue** (Table 1 tetap ada, cuma 1 tiket tersisa) — persis skenario FASE 9 yang paling penting, semua kejadian otomatis tanpa aksi manual tambahan.
  - Render ulang frontend → Table 4 hilang dari kitchen board, Table 1 tetap tampil — konsisten sama ground truth.
  - `npx tsc --noEmit`: **0 error**. `npx eslint`: 0 error di semua file yang disentuh (sisa error project-wide di 3 file yang emang belum disentuh dari awal: `Navbar.tsx`, `carousel.tsx`, `RestaurantEvents.tsx`).
- [ ] **⚠️ Belum diverifikasi manual di browser**: klik "Start Cooking"/"Mark Served" beneran kerasa instan (optimistic update, bukan nunggu refetch); polling 4 detik ke-reflect device/tab lain; header "← Admin"/Logout Kitchen jalan normal.

### FASE 10 — Dashboard Analytics (`/admin/dashboard`, halaman baru) ✅ SELESAI

**Halaman ini belum ada sama sekali sebelumnya** (100% `DUMMY_DASHBOARD_DATA`/`DUMMY_MENU_PERFORMANCE`, `useState`, nol panggilan API) — kontrak backend (`analytics.{schema,controller,service}.ts`) dibedah & didiskusikan ke user dulu sebelum coding (bukan cuma asumsi dari mock). `types/api.ts` `AnalyticsOverview`/`AnalyticsTimelineEntry`/`MenuPerformanceEntry` **udah match 100%** dari FASE 1, gak perlu ditambah.

**Kontrak backend (owner only, semua 3 endpoint, TANPA `noStore`/polling):**
- `GET /admin/analytics?date=` (default hari ini Jakarta) → `total_bookings` (SEMUA status), `total_walk_ins` (order tanpa `booking_id`), `total_revenue` (**cents**, exclude cancelled), `occupancy_rate` (%), `no_show_count`, `menu_top` (top 5, `{name, order_count}`).
- `GET /admin/analytics/timeline?date=` → 14 slot `08:00`-`21:00`, `{hour, booking_count}`, semua status booking.
- `GET /admin/analytics/menu-performance?range=today|week` (`week` = 7 hari ROLLING) → **SEMUA** item ke-order, `{menu_item_id, name, order_count}`, gak dibatasi top-N.

**Mismatch mock vs backend, didiskusikan ke user sebelum coding:**
1. **Kolom "Category" & "Gross Revenue"** di tabel Menu Performance mock — backend `menu-performance` gak return keduanya. Sempat dipertimbangkan join `GET /admin/menu` buat Category, tapi **diputuskan drop kedua kolom** — dashboard harus **self-contained** (murni 3 endpoint analytics, gak narik endpoint menu lain), konsisten prinsip kerja "one-by-one". Tabel final = **2 kolom: Item Name + Orders**.
2. **`order_count` bukan qty** — backend ngitung jumlah baris order, bukan porsi terjual. Mock pakai wording "SOLD"/"Volume" yang menyesatkan → **diganti "× ordered" / "Orders"**, angka backend tetap ditampilkan apa adanya.
3. **"Total Walk-Ins"** — angkanya = semua order (karena `Order.bookingId` gak pernah diisi backend, jadi "order tanpa booking" = semua order). **Diputuskan**: tetap tampil apa adanya, label gak diubah (ikut field backend) — dicatat sebagai **isu data backend**, bukan dibenerin/diakalin di FE, buat fase lain.
4. **Chart** — cuma 1 (timeline), sesuai spec awal. Sempat didiskusikan nambah chart FE-only (top-menu jadi bar chart) atau ekspansi backend (revenue-over-time dll), tapi **diputuskan backend TIDAK disentuh** di fase ini — 1 chart cukup buat snapshot harian, ekspansi analytics jadi fase terpisah kalau mau.
5. Revenue: mock anggap dolar utuh → backend **cents**, dipakein `formatUsd` (`lib/utils`). Timeline `bookings`→`booking_count`, toggle `TODAY|WEEK`→`today|week`, date picker UTC→Asia/Jakarta.

**Implementasi:**
- [x] `recharts` — udah kepasang dari awal (`^3.9.2`), skip install.
- [x] Buat `lib/queries/analytics.ts` — `analyticsOverviewQueryOptions(date, cookie?)`, `analyticsTimelineQueryOptions(date, cookie?)`, `menuPerformanceQueryOptions(range, cookie?)`. Query key dash-string (`['analytics-overview', date]` dst), pola sama `bookings.ts`.
- [x] Ubah `app/(admin)/admin/dashboard/page.tsx` → Server Component, `Promise.all([fetchQuery(overview), fetchQuery(timeline), fetchQuery(menuPerf)])` + `try/catch` Access Denied (pola sama POS FASE 8).
- [x] Buat `components/admin/dashboard/DashboardBoard.tsx` (`'use client'`) — stat cards, bar chart Recharts (timeline), list top-5 dari `menu_top` (bukan fetch terpisah), tabel Menu Performance 2 kolom, empty state "No data for this date" (timeline all-zero / `menu_top` kosong / menu-performance kosong), `useSuspenseQuery` x3 **tanpa `refetchInterval`**.
- [x] Buat `components/admin/dashboard/DashboardSkeleton.tsx` (baru, pola sama `TablesSkeleton`).
- [x] **Test end-to-end kuat (curl + browser SSR asli, bukan cuma tsc):**
  - `npx tsc --noEmit`: 0 error di ke-4 file (sisa 3 error project-wide di `app/(admin)/admin/menu/page.tsx`, FASE 11, mock lama yang emang belum disentuh). `npx eslint` ke-4 file: 0 error/warning.
  - Login owner via `curl` (`/api/auth/sign-in/email`) → hit `GET /admin/analytics`, `/timeline`, `/menu-performance?range=today|week` langsung ke backend: data nyata masuk akal (2 booking, revenue $140.30, timeline nunjuk 2 booking jam 19:00, top menu "Mixed Rice Platter" dkk).
  - `curl -b <cookie> http://localhost:3000/admin/dashboard` → HTTP 200, HTML SSR beneran ngandung `total_bookings":2`, `total_revenue":14030`, `occupancy_rate":11`, item "Mixed Rice Platter", wording "ordered", header tabel "Orders" — **cocok persis** sama hasil curl langsung ke backend. Kolom "Category"/"Gross Revenue" dan sisa string mock lama (`WAGYU`, `TRUFFLE FRIES`, `SOLD`) **gak ketemu** di HTML (konfirmasi beneran ke-drop).
  - Role guard: login cashier → `/admin/dashboard` **307 redirect ke `/admin/pos`** (proxy gate); `GET /admin/analytics` langsung ke backend **403 FORBIDDEN** (route guard `requireRole('owner')`) — dua lapis proteksi kekonfirmasi jalan.
- [ ] **⚠️ Belum diverifikasi manual di browser**: ganti tanggal via date picker beneran mengganti chart/stat card (klik asli, bukan cuma query-key logic); toggle Today/Week di Menu Performance; tampilan empty-state ("No data for this date") di tanggal yang beneran kosong.

### FASE 11 — Menu CRUD (`/admin/menu`, halaman baru) ✅ SELESAI

**Halaman ini sebelumnya 100% mock** (`INITIAL_CATEGORIES`/`INITIAL_MENU_ITEMS`, `useState` in-memory, `currentRole='OWNER'` hardcoded, `alert()`/`confirm()`, hilang saat refresh). Kontrak backend (`menu.{schema,controller,service}.ts` + `menu-category.*`) dibedah & didiskusikan ke user dulu sebelum coding.

**Kontrak backend:**
- `GET /admin/menu` (owner, cashier) — **TANPA query param apapun**. Return **flat array**, semua item `deletedAt:null` (termasuk `out_of_stock`), tiap item nempel `category:{id,name}` (nested, bukan flat). Search/filter kategori client-side.
- `POST /admin/menu` (owner only, `multipart/form-data`) — `category_id`, `name`, `price` (**cents**, coerced), `description?`, `tags?` (comma-string/array), `status?`, `sort_order?`, `image?` (≤5MB, image/*).
- `PATCH /admin/menu/:id` (owner only, multipart) — semua opsional, boleh cuma ganti gambar.
- `DELETE /admin/menu/:id` (owner only) — soft delete, `204`.
- `GET/POST/PATCH/DELETE /admin/menu-categories` — GET (owner, cashier) semua kategori (aktif+nonaktif). POST **cuma terima `name`** (gak ada `is_active` — kategori baru selalu aktif). PATCH/DELETE (owner only), DELETE = soft (`is_active:false`) **tanpa block-if-referenced**.

**Mismatch mock vs backend, didiskusikan ke user sebelum coding:**
1. **🔴 Price = cents, mock anggap dolar utuh** (bug krusial, kalau gak difix isi "35" bakal ke-submit sebagai $0.35). **Diputuskan**: input dolar (mis. "12.50"), FE `× 100` jadi cents sebelum submit.
2. **`category_name` flat field gak ada di backend** (nested `category:{id,name}`) → ganti `item.category?.name`, sekalian type `MenuItem.category` di `types/api.ts` dipersempit dari full `MenuCategory` ke `{id,name}` (match persis apa yang backend kirim).
3. **`description` string kosong** → transform `''`→`undefined` sebelum submit (backend `min(1)` kalau diisi).
4. **`sort_order`** ada di backend, mock gak expose. **Diputuskan: skip**, default 0.
5. Upload gambar: mock cuma simpan base64 preview, gak pernah kirim file asli → disimpan juga raw `File` di state buat FormData submit, preview base64 tetap dipakai buat UX.
6. Toast `alert()`/`toastSimulate()` → `sonner`. Role hardcoded → `useSession()` asli. Delete `window.confirm()` — **udah konsisten** sama `TablesBoard`, gak diubah.

**3 ide tambahan disepakati & diimplementasi:**
- **Modal pakai `Dialog` shadcn** (bukan hand-rolled `fixed inset-0` overlay) — konsisten `TablesBoard`/`POSBoard`.
- **Validasi tipe file client-side** (`file.type.startsWith('image/')`) selain cek ukuran 5MB.
- **Warning "Deactivate Category" pakai angka riil** — dihitung dari `menuItems.filter(i => i.category_id === cat.id).length` (data yang udah ke-fetch di halaman sama, zero fetch tambahan). Toggle status tetap **non-optimistic** (pola Tables/Bookings, bukan Kitchen).

**Implementasi:**
- [x] Perbaiki `types/api.ts` — `MenuItem.category` dipersempit ke `{id, name}`.
- [x] Buat `lib/queries/menu.ts` — tambah `adminMenuQueryOptions(cookie?)`, `menuCategoriesQueryOptions(cookie?)`, mutation `createMenuItem`/`updateMenuItem`/`deleteMenuItem` (FormData via `MenuItemFormInput`), mutation kategori `createCategory`/`updateCategory`/`deleteCategory` (JSON, `CreateCategoryInput` cuma `{name}`).
- [x] Ubah `app/(admin)/admin/menu/page.tsx` → Server Component, `Promise.all([fetchQuery(adminMenu), fetchQuery(categories)])` + Access Denied.
- [x] Buat `components/admin/menu/MenuCrudBoard.tsx` (`'use client'`) — tabel + modal Add/Edit Menu (`Dialog` shadcn, upload gambar+preview+validasi tipe&ukuran) + modal Add/Edit Category (checkbox `is_active` cuma muncul pas edit, bukan create) + toggle status non-optimistic + warning deactivate dengan angka riil + role gate `isOwner` + empty state "No items found"/"No categories found".
- [x] Buat `components/admin/menu/MenuSkeleton.tsx` (baru, pola sama `TablesSkeleton`).
- [x] **Test end-to-end kuat (curl + browser SSR + real Cloudinary upload, bukan cuma tsc):**
  - `npx tsc --noEmit`: **0 error project-wide** (otomatis nyelesain juga 3 error pre-existing yang lama nangkring di file mock ini). `npx eslint`: 0 error, 2 warning `<img>` (pola pre-existing yang sama persis ada di `MenuSection.tsx`/`POSBoard.tsx` yang gak disentuh — dikonfirmasi bukan regresi).
  - `curl` GET langsung ke backend (`/admin/menu`, `/admin/menu-categories`) → data asli match kontrak persis (category nested, price cents).
  - `curl` SSR `/admin/menu` → HTML mengandung data asli ("Mixed Rice Platter", "Food", "$25.00" dst), nol sisa string mock lama (WAGYU/PALMDINE/TRUFFLE FRIES).
  - **Full round-trip nyata**: `POST` item baru (price `999` simulasi FE kirim "9.99"×100) → `PATCH` full-field (simulasi toggle status) → `PATCH` **image-only** (upload PNG asli ke Cloudinary, `secure_url` beneran balik, field lain gak berubah — mengkonfirmasi klaim "PATCH boleh cuma ganti gambar" jalan) → `DELETE` (soft, hilang dari admin list).
  - **Skenario paling kritis**: buat kategori temp, taruh item di dalamnya → muncul di `/menu` publik. Nonaktifkan kategori → item **hilang dari publik** tapi **tetap ada** di `GET /admin/menu` dengan `category` masih nempel, kategori `is_active:false` di admin list — persis sesuai kontrak yang didiskusikan.
  - Role guard: cashier `GET /admin/menu` → 200 (read-only), `POST`/`DELETE /admin/menu-categories` → 403 FORBIDDEN. SSR `/admin/menu` sebagai cashier → 200, badge "READ ONLY" muncul, tombol "Add Menu" **gak ada** di HTML.
- [ ] **⚠️ Belum diverifikasi manual di browser**: klik interaksi modal beneran (buka/tutup Dialog, upload file dari file picker asli, preview muncul instan); toggle status per-baris; search+filter kategori client-side responsif tanpa lag.

### FASE 12 — Regresi penuh
- [ ] Jalankan ulang checklist §9 dari atas ke bawah satu-satu
- [ ] Cek console browser tiap halaman yang di-split (Tables, Bookings, POS, Kitchen, Admin layout) — pastikan 0 hydration mismatch warning

**Tidak dikerjakan:** Settings & AI Chat (blocked backend, lihat §7) — skip, jangan mulai.

---

## 11. Catatan Handoff — Sesi Berikutnya Baca Ini Dulu

### 🔴 BACA DULU: Ringkasan akhir sesi 15 Juli 2026 — mulai dari sini besok

**Progress: FASE 1-9 SELESAI & jalan (full loop Booking→POS→Kitchen tercapai). FASE 10 (Dashboard) & FASE 11 (Menu CRUD): analisis backend + spek UI SUDAH SELESAI hari ini, tapi IMPLEMENTASI BELUM DIMULAI SAMA SEKALI** — besok tinggal eksekusi pakai detail kontrak yang udah ditulis lengkap di §10 FASE 10/FASE 11 di atas (jangan baca ulang backend dari nol, semua field/endpoint/gotcha udah dicatat di situ).

**Yang dikerjain sesi ini (15 Juli), urut:**
1. Follow-up role guard: `lib/admin-routes.ts` + `proxy.ts` cek role (bukan cuma login) — lihat detail di bawah.
2. Revisi kecil: cashier dibukin akses `/admin/tables` lagi (halaman doang, endpoint tetap sama), dan fix gap "user yang udah login masih bisa buka `/admin/login`".
3. Styling pass #1: ikutin `frontend/templateui.md` (file referensi visual user, BUKAN bagian plan) — `AdminShell`/`AdminSidebar` jadi collapsible, `POSBoard` layout disamain proporsi grid-nya. **CSS DOANG, logic gak disentuh.**
4. User sempat edit `POSBoard.tsx` manual sendiri (murni CSS) — ke-detect ada 1 fungsi (`closeCheckout`) ke-hapus gak sengaja pas editnya, udah diperbaiki (cuma nambah balik fungsinya, gak sentuh yang lain).
5. Styling pass #2: `BookingsBoard.tsx` — ganti dropdown manual (`activeActionMenu` state + div absolut) jadi komponen `DropdownMenu` asli dari `@/components/ui/dropdown-menu` (udah ada di project dari awal, baru sekarang dipakai) — ikutin contoh dari `templateui.md` lagi.
6. Analisis (bukan implementasi) FASE 10 Dashboard & FASE 11 Menu CRUD — baca lengkap di §10 masing-masing FASE.

**⚠️ Hal krusial biar gak keulang baca/nanya lagi besok:**
- **`frontend/templateui.md` itu file referensi visual yang ISINYA BERUBAH-UBAH** tiap kali user minta styling baru (bukan dokumen statis) — dia paste kode dari app lain yang pernah dia buat sebagai CONTOH CSS/struktur, BUKAN kode yang harus di-copy-paste mentah (logic-nya beda dari punya kita — misal pakai server action buat auth, role prop manual, bukan `useSession()`/`getAdminRouteRoles()` yang kita pakai). **Kalau user nyuruh "cek templateui.md" lagi buat halaman lain, BACA ULANG file itu duluan** (isinya pasti udah ganti dari terakhir kali dibaca), analisis diff CSS-only-nya, JANGAN ubah logic/backend call.
- Pola kerja user buat setiap FASE baru: **selalu minta analisis dulu** (baca backend lengkap, bandingin ke UI/spek, sampaikan format kontrak+gap) **sebelum** nulis rencana konkret atau coding. Ikutin urutan: analisis → (diskusi/tanya kalau ada keputusan produk) → rencana konkret → "gas implement" baru mulai coding.
- Buat halaman yang BELUM ADA mock-nya sama sekali (Dashboard, Menu CRUD) — gak ada "gap dibanding mock" buat dianalisis, jadi formatnya beda: langsung kontrak backend + spek UI (kayak contoh format yang user kasih sendiri: "Create /admin/bookings page. Date picker... View toggle...").
- Semua pelajaran arsitektur FASE 6-9 (fetchQuery vs prefetchQuery, void vs await, role guard matrix) ada di bagian "Hal teknis penting" di bawah — masih berlaku penuh buat FASE 10/11.

---

*(Bagian di bawah ini ditulis di sesi-sesi sebelumnya — masih relevan, dibaca kalau butuh detail lebih dalam soal fase yang udah selesai.)*

### Follow-up styling (15 Juli 2026): ikutin `templateui.md` — CSS/typografi doang, logic gak disentuh

User punya file referensi `frontend/templateui.md` (bukan bagian dari plan ini, cuma reference visual) dari app lain yang pernah dia buat, minta beberapa komponen disamain stylingnya **tanpa ubah logic/fitur**:
- **`AdminShell.tsx` + `AdminSidebar.tsx`** — ditambah **collapsible sidebar** (`isCollapsed` state + tombol chevron, lebar `25vw`/`260px` expanded ↔ `70px` collapsed cuma ikon+badge "P"), container jadi `h-screen max-h-screen overflow-hidden` (fixed-frame), tambah highlight link aktif (`usePathname`). **`AdminTopbar.tsx` gak diubah** — udah 100% match template dari awal. Auth/role-guard logic (`useSession`, `useMutation(signOut)`, `getAdminRouteRoles`) **dipertahankan**, template pakai pola beda (server action, role prop manual) yang SENGAJA gak diikutin.
- **Deviasi kecil yang diambil sendiri**: `overflow-hidden` di `<main>` (versi template) diganti **`overflow-y-auto`** — biar konten panjang (Tables grid, Bookings list) tetap bisa di-scroll, gak kepotong (halaman-halaman itu belum punya scroll container sendiri kayak POS/Kitchen yang emang udah didesain full-viewport).
- **`POSBoard.tsx`** — proporsi grid 3 panel disamain jadi rata (`md:col-span-3` semua, drop `lg:col-span-2.5`/`3.5` yang asimetris), floor plan grid meja jadi 1 kolom per row di desktop (bukan 2), baris kapasitas digabung sama area (`{capacity} PAX · {area}`), label "ORDER SUMMARY"→"ORDER", "Tax"→"Pajak", "Service Charge"→"Service". **Semua fitur yang gak ada di template (checkout Dialog, disable out_of_stock/maintenance, customer phone field) dipertahankan penuh** — diverifikasi ulang lewat curl setelah perubahan (Bill button, PAX·area, label baru, semua ke-render benar).
- `npx tsc --noEmit`: 0 error. `npx eslint`: bersih di semua file yang disentuh.
- **⚠️ Belum diverifikasi manual di browser**: animasi collapse sidebar pas tombol chevron diklik, highlight active-link pas pindah halaman, layout 1-kolom floor plan POS kerasa proporsional di berbagai ukuran layar.

### Progress: FASE 1-9 selesai & jalan (full loop tercapai), FASE 10 (Dashboard) berikutnya

- ✅ **FASE 1** — Fondasi data layer (`lib/api-client.ts`, `lib/query-client.ts`, `app/providers.tsx`, `types/api.ts`)
- ✅ **FASE 2** — Auth dasar (`lib/auth-client.ts`, `hooks/use-session.ts`, `proxy.ts` — **bukan** `middleware.ts`, sudah di-rename ikut konvensi baru Next.js 16)
- ✅ **FASE 3** — Login form + Admin Shell + role-based sidebar, plus follow-up: inline error di bawah form login, tombol Logout di Kitchen header
- ✅ **FASE 4** — Menu publik (`/menu`) full Suspense+skeleton streaming, filter kategori+search, plus follow-up: Landing page `FlowingMenu` deep-link ke `/menu?category=X`
- ✅ **FASE 5** — Booking form + Konfirmasi, react-hook-form+Zod v4, generate `.ics` asli, plus audit field vs `booking.schema.ts` backend (2 bug ketemu & fixed: timezone Jakarta, `special_requests` kosong)
- ✅ **FASE 6** — Tables management, split Server+Client pertama kali (jadi pola rujukan FASE 7-9), Create/Edit/Delete meja baru (gak ada di mock lama), hapus panel history & area VIP. **2 bug arsitektur ketemu & fixed**: (1) SSR prefetch endpoint ber-auth WAJIB `await` (bukan `void` kayak Menu), (2) `prefetchQuery` doang gak cukup, kudu `fetchQuery`+`try/catch` biar error (mis. role salah) ketangkep, bukan ke-swallow diam-diam — lihat detail lengkap di §10 FASE 6 dan poin baru di "Hal teknis penting" di bawah.
- ✅ **Follow-up FASE 6 (15 Juli 2026)** — role-based route guard "proper": `lib/admin-routes.ts` (matrix `ADMIN_ROUTE_ROLES`, satu sumber kebenaran) + `proxy.ts` sekarang cek role (bukan cuma login) + `AdminSidebar.tsx` reuse matrix yang sama. Matrix disepakati: Owner=semua, Cashier=Bookings/POS/Menu(view), Kitchen=Kitchen doang; Tables utk cashier cuma HALAMAN yang ditutup (endpoint API tetap kebuka buat dipakai POS). Detail di §10 setelah checklist FASE 6.
- ✅ **FASE 7** — Bookings admin, List+Timeline di-wire ke `GET/PATCH /admin/bookings` asli. Hapus tombol Edit (gak ada endpoint) + area VIP, tambah tombol "Mark Completed" + badge `special_requests`/histori customer (gak ada di mock lama). 2 booking test (`Rina Wijaya`, `WB-14072026-001/002`) sengaja dibiarkan di DB buat verifikasi manual browser. Detail di §10 FASE 7.
- ✅ **FASE 8** — POS, 3-panel di-wire ke `POST /admin/orders` + `GET /admin/tables`+`GET /menu` (paralel) asli. Checkout (Lihat Bill + Tandai Lunas) ikut dibangun di fase ini (bukan dipisah) — `GET .../orders?table_id=&status=active` + `GET .../bill` + `PATCH payment_status`. Cart estimasi tax 10%/service 5% hardcode terbukti match 100% ke angka asli backend (diverifikasi lewat order sungguhan). Detail di §10 FASE 8.
- ✅ **FASE 9** — Kitchen, board di-wire ke `GET /admin/kitchen-queue` + `PATCH /admin/order-items/:id` asli. **Ditemukan & diselesaikan 2 mismatch struktural**: (1) item `ready` hilang dari API by design (PRD), UI disederhanain jadi 2 tahap Pending→Cooking→langsung Served; (2) mock nganggap 1 order=1 status, backend track PER ITEM — kartu tiket tetap per-order tapi tombol advance per-item. **Milestone "full loop" tercapai & diverifikasi end-to-end**: serve semua item di 1 order → order auto-`completed` → meja auto-balik `available` → tiket hilang dari queue, semua otomatis tanpa aksi manual. Detail di §10 FASE 9.
- ⏭️ **FASE 10 (Dashboard Analytics)** — belum dimulai, halaman baru (belum ada page-nya sama sekali). Checklist detailnya di §10. **Ingat pelajaran FASE 6-9**: prefetch endpoint ber-auth pakai `fetchQuery`+`try/catch` (bukan `prefetchQuery`/`void`); role guard `/admin/dashboard` **udah otomatis ke-handle** `proxy.ts` (owner-only). Data buat chart udah ada dari testing fase-fase sebelumnya (booking/order/revenue asli), jadi angka di stat card bisa langsung dicek cocok gak sama data yang udah dibuat.

### Sebelum lanjut FASE 7, ada verifikasi manual browser yang masih nge-gantung (curl gak bisa test ini)

Cek dulu satu-satu ke user apakah sudah dicoba (kalau belum, tanya duluan sebelum asumsi semua beres):
1. Klik tombol login redirect ke halaman yang benar per role (§10 FASE 3, baris ~311)
2. Klik Logout dari Topbar admin biasa balik ke `/admin/login` (§10 FASE 3, baris ~311)
3. Tombol "← Admin" muncul di Kitchen header buat owner (§10 FASE 3 follow-up, baris ~328)
4. Skeleton Menu kelihatan pas loading + interaksi tab/search kerasa instan (§10 FASE 4, baris ~346)
5. Klik tab kategori di `/menu` update address bar browser (§10 FASE 4 follow-up, baris ~366) — **ini sudah dikonfirmasi user works** di sesi ini
6. Error inline per-field di form Booking + toast error 422/409 (§10 FASE 5, baris ~382)
7. **[BARU FASE 6]** Buka Create/Edit dialog Tables, isi form, submit — cek toast sukses & data persist. Klik Delete + confirm popup browser. Filter area/status beneran in-memory (cek Network tab gak ada request baru). Polling ~12 detik ke-reflect tanpa refresh manual. (§10 FASE 6, baris ~453)

*(Update: poin 5 sudah dikonfirmasi user "works mantap" di sesi ini bareng poin lain soal FlowingMenu — sisanya belum eksplisit dikonfirmasi ulang setelah perubahan terbaru.)*

### Keputusan yang tadinya OPEN — sudah CLOSED di akhir sesi ini (14 Juli 2026)

- ~~**Area "VIP"**~~ — **SUDAH DIPUTUSKAN**: dihapus dari filter area (backend cuma `indoor`/`outdoor`). Ini sekaligus jadi contoh penerapan **prinsip standing baru**: "backend adalah kiblat" — apapun yang ada di frontend/mock tapi gak ada di backend, yang disesuaikan itu frontend, bukan minta backend nambah. Prinsip ini dicatat di Context plan.md paling atas dan berlaku buat SEMUA fase berikutnya (bukan cuma soal VIP) — kalau nemu mismatch lagi di FASE 6-11, langsung ikutin prinsip ini tanpa perlu tanya ulang ke user.

### Hal teknis penting yang perlu diinget (biar gak keulang nanya/salah lagi)

- **Zod di project ini v4** (`^4.4.3`), bukan v3 — custom error message di top-level schema constructor (`z.enum(values, {...})`) pakai key **`error`**, bukan `message`. Method chain (`.min()`, `.refine()`, dll) tetap terima string shorthand kayak v3. Kalau ragu, cek langsung `node_modules/zod/v4/core/api.d.ts`, jangan andelin ingatan.
- **react-hook-form + `z.coerce`**: butuh 3 generic (`useForm<Input, Context, Output>` — pakai `z.input<>`/`z.output<>`) kalau schema ada field yang di-coerce (misal `party_size`), gak cukup 1 generic `z.infer<>` doang.
- **Booking date & timezone**: backend selalu hitung "hari ini" pakai `Asia/Jakarta` eksplisit (`todayInJakarta()` di `booking.schema.ts` & `booking.service.ts`) — kalau nambah validasi tanggal lain di frontend nanti (misal di admin Bookings), pastikan pakai teknik yang sama (`toLocaleDateString('en-CA', {timeZone:'Asia/Jakarta'})`), jangan `new Date()` polos.
- **Table assignment backend** (`findAvailableTable` di `booking.service.ts`): deterministik, bukan random — filter area (kalau bukan no_preference) → urut kapasitas terkecil dulu → pilih pertama yang gak bentrok jadwal. Kalau ada beberapa meja kapasitas SAMA, urutan di antara mereka gak dijamin oleh area (murni urutan natural DB), ini "abu-abu" yang perlu diinget kalau nanti ada pertanyaan soal fairness/prioritas alokasi meja.
- **Dev server**: punya user sendiri yang jalan persisten di port 3000 (bukan yang aku start) — kalau butuh restart, hati-hati (pernah crash sekali gara-gara race condition rename `middleware.ts`→`proxy.ts`, sudah di-fix & di-restart).
- **⚠️⚠️ SSR prefetch endpoint ber-auth di halaman admin — 2 syarat, BUKAN cuma 1 (ketemu di FASE 6, 2 bug beruntun, koreksi catatan lama)**:
  1. **`void` tanpa await CUMA aman utk endpoint PUBLIK** (`/menu`, FASE 4). Endpoint `/admin/*` WAJIB **`await`** prefetch-nya — kalau enggak, query masih `pending` pas `dehydrate()` dipanggil, KELUAR dari hydrated state (default `shouldDehydrateQuery` cuma include `success`), client component fetch ulang sendiri saat SSR **tanpa cookie** (`credentials:'include'` no-op di Node fetch) → `401` palsu.
  2. **`await queryClient.prefetchQuery(...)` AJA GAK CUKUP** — `prefetchQuery` didesain sengaja **`.catch(noop)`** (source `@tanstack/query-core`), gak pernah reject walau fetch-nya beneran gagal. Kalau role user salah (endpoint balikin `403 FORBIDDEN`), query itu berstatus `error` — TETEP keluar dari `dehydrate()` (sama kayak `pending`), client tetep fetch ulang tanpa cookie, muncul `401 "Session is invalid"` yang MENYESATKAN (nutupin akar masalah 403 role). **Fix bener: pakai `fetchQuery` (bukan `prefetchQuery`) dibungkus `try/catch`**, render "Access Denied" kalau gagal (lihat pola di `app/(admin)/admin/tables/page.tsx`).
  - Ketauan pas FASE 6 (Tables) lewat testing curl + laporan user login kitchen buka Tables. **WAJIB diterapkan sama persis di FASE 7-11** (Bookings, POS, Kitchen, Dashboard, Menu CRUD) — SEMUA endpoint admin punya role restriction (cek matrix per endpoint di bagian atas plan ini), jadi role yang salah PASTI bakal ke-trigger kalau user coba akses langsung via URL (gak cuma disembunyikan sidebar).
  - `ROLE_LANDING_PAGE` (map role→landing page) ada di `lib/role-landing.ts` — reuse buat link "back to dashboard" di Access Denied UI tiap halaman baru.
- ~~**2 error TypeScript pre-existing** di `bookings/page.tsx`~~ — **UDAH HILANG**, file itu ditulis ulang total di FASE 7. Per akhir sesi 15 Juli 2026, `npx tsc --noEmit` di seluruh project = **0 error, titik**. Kalau nanti muncul error baru pas lanjut FASE 10/11, itu genuinely baru, bukan sisa lama.
- **Komponen `components/ui/*` base-ui (bukan Radix)**: `Dialog`/`Select` pakai prop `render={<button/>}` buat trigger custom, bukan `asChild`. `DropdownMenu` (`@/components/ui/dropdown-menu.tsx`) juga udah ada dari awal project tapi baru dipakai pertama kali di `BookingsBoard.tsx` sesi ini (`DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem`, prop `align="end"` buat posisi). Kalau butuh dropdown/menu popup di Dashboard/Menu CRUD nanti, reuse komponen ini, jangan bikin dropdown manual pakai `useState`+div absolut lagi.


Saya sudah membaca seluruh kode backend dan frontend (langsung dari source, bukan cuma dari doc).
  Berikut analisis lengkapnya.

  Gambaran umum

  Ini sistem manajemen restoran (satu resto: "Warung Bagas", brand FE "Palmdine", internal "Megatha
  Kitchen"). Dua repo terpisah, deploy terpisah, komunikasi lintas-origin.

  ┌───────┬───────────────────────────────────────┬────────────────────────────────────────────┐
  │       │                Backend                │                  Frontend                  │
  ├───────┼───────────────────────────────────────┼────────────────────────────────────────────┤
  │       │ Express 5, TypeScript, Prisma 7       │ Next.js 16 (App Router), React 19,         │
  │ Stack │ (Postgres/Neon), better-auth, Zod     │ TanStack Query 5, Tailwind v4, shadcn/Base │
  │       │                                       │  UI                                        │
  ├───────┼───────────────────────────────────────┼────────────────────────────────────────────┤
  │ Peran │ Source of truth — REST API,           │ UI publik + dashboard staff                │
  │       │ snake_case di boundary                │                                            │
  ├───────┼───────────────────────────────────────┼────────────────────────────────────────────┤
  │ Auth  │ better-auth (email/password, cookie   │ Cookie cross-origin (credentials: include) │
  │       │ httpOnly)                             │  + gate di proxy.ts                        │
  └───────┴───────────────────────────────────────┴────────────────────────────────────────────┘

  Arsitektur backend

  Modular per fitur (src/modules/<fitur>/{routes,controller,service,schema}.ts). Pola konsisten &
  bersih:
  - Error handling terpusat — service throw AppError(status, code, msg), ditangkap errorHandler
  global. Controller tanpa try/catch (Express 5 auto-forward).
  - Auth: better-auth di-mount langsung (app.all('/api/auth/*splat')), bukan modul auth/ (itu dead
  code). requireAuth → requireRole guard.
  - Rate limit 3 lapis: umum (100/mnt/IP), booking (10/jam/IP), admin (300/mnt per user-id).
  - Realtime = polling, bukan WebSocket (sengaja, karena target Vercel serverless). Cache-Control: 
  no-store di endpoint yang di-poll.
  - Uang = integer USD cents di seluruh sistem.
  - No-show dual-trigger: node-cron (dev) + POST /internal/cron/no-show (Vercel Cron,
  shared-secret).

  Sudah lengkap: booking (auto-assign meja deterministik + anti double-book), menu (soft-delete,
  upload Cloudinary), table, order/POS, kitchen (KDS), analytics.

  Arsitektur frontend

  - Route group: (public) (landing, menu, booking), (admin) (shell + sidebar), (admin-standalone)
  (kitchen & login, full-screen tanpa shell).
  - Data langsung ke Express via apiFetch (lib/api-client.ts) — Next tidak mem-proxy data, hanya
  gate sesi/role di proxy.ts (middleware Next 16) untuk /admin/*.
  - Types mirror backend snake_case (types/api.ts) — sesuai memori "backend is source of truth".
  - Polling: kitchen 4 dtk, tables/POS/bookings 12 dtk.
  - Pola SSR bagus: pakai fetchQuery (bukan prefetchQuery) supaya error 403 auth ke-surface sebagai
  "Access Denied", bukan hilang diam-diam.

  ⚠️  Temuan penting

  Fitur belum jadi / masih mock:
  1. AI Concierge = vaporware. src/modules/ai/* semua cuma // TODO satu baris (tak ada
  RAG/Gemini/vector search), tapi aiRouter tetap di-mount → semua /ai/* jatuh ke 404. Tak ada UI
  chat sama sekali di FE. Padahal ini fitur inti di PRD, dan schema VectorStore(vector 768) sudah
  disiapkan.
  2. Dashboard admin 100% dummy — DUMMY_DASHBOARD_DATA hardcoded, nol panggilan API, padahal
  endpoint /admin/analytics di backend sudah jadi & type-nya sudah ada (tapi belum dipakai).
  3. Menu editor admin (/admin/menu) 100% mock — useState in-memory, currentRole='OWNER' hardcoded,
  pakai alert()/confirm(), hilang saat refresh. Backend /admin/menu sudah lengkap tapi belum
  di-wire.
  4. Modul auth/ backend = dead code (tak pernah di-import).

  Bug logika (yang ini nyata, bukan kosmetik):
  5. Order.bookingId tak pernah diisi. createOrder tak menerima/set field ini. Akibatnya
  total_walk_ins di analytics = "order dengan bookingId null" → semua order selalu terhitung 
  walk-in, dan order tak pernah tertaut ke booking di mana pun.
  6. Hitungan menu populer salah — pakai _count: { menuItemId } (jumlah baris), mengabaikan qty.
  Item dipesan sekali dengan qty 10 dihitung 1.
  7. listCategories (admin) tak filter isActive → kategori yang "dihapus" (soft-delete) tetap
  muncul.
  8. POS pajak/service hardcoded (10%/5%) di client — bisa beda dari bill asli backend.
  9. Minor: 500 handler membocorkan err.message internal ke client; env.ts tanpa validasi (secret
  default ''); double <Footer> di route booking & menu.

  Kesimpulan

  Alur customer (landing → menu → booking → konfirmasi) dan 3 board admin (tables, bookings, POS) +
  KDS kitchen benar-benar jalan end-to-end dengan polling & auth. Yang tersisa: AI concierge 
  (belum ada), dashboard & menu-editor (masih mock), plus beberapa bug logika di atas.