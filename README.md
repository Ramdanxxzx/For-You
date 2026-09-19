# Toko POS

Aplikasi kasir (POS) sederhana untuk toko: manajemen produk, transaksi kasir, dan laporan penjualan. Backend Node.js/Express dengan database SQLite (modul bawaan `node:sqlite`, tanpa dependency native), frontend HTML/CSS/JS biasa (tanpa framework/build step).

> Butuh **Node.js versi 22.5 atau lebih baru** (memakai modul bawaan `node:sqlite`, bukan native addon seperti `better-sqlite3`, supaya tidak perlu compiler C++/Visual Studio Build Tools saat `npm install`).

## Fitur

- **Login** dengan sesi, dua peran: `admin` dan `kasir`.
- **Dashboard**: penjualan hari ini & bulan ini, produk terlaris 7 hari terakhir, peringatan stok menipis.
- **Kasir (POS)**: cari produk, tambah ke keranjang, hitung kembalian, checkout, struk transaksi. Stok otomatis berkurang saat checkout.
- **Manajemen Produk**: tambah/ubah/hapus produk (khusus admin), kasir hanya bisa melihat.
- **Laporan Penjualan**: daftar transaksi dengan filter tanggal, dan detail per transaksi.

## Menjalankan

```bash
npm install
npm start
```

Buka `http://localhost:3000` di browser. Database SQLite (`server/data/toko.db`) dan akun contoh dibuat otomatis saat pertama kali dijalankan.

### Akun contoh

| Username | Password  | Peran |
|----------|-----------|-------|
| admin    | admin123  | admin |
| kasir    | kasir123  | kasir |

## Jadikan Aplikasi Desktop (Electron)

Aplikasi ini bisa dibungkus jadi aplikasi desktop (tanpa perlu buka terminal atau ketik `npm start`) memakai Electron.

```bash
npm install       # sekali saja, mengunduh Electron & electron-builder
npm run electron  # coba jalankan sebagai aplikasi desktop (jendela sendiri, server otomatis di baliknya)
```

Untuk membuat file installer/`.exe` yang bisa dibagikan dan diklik dua kali di komputer lain:

```bash
npm run dist:win     # khusus Windows: menghasilkan installer NSIS + versi portable di folder dist/
npm run dist         # otomatis sesuai OS tempat perintah dijalankan (mac -> .dmg, linux -> AppImage)
```

Hasil build ada di folder `dist/` (tidak ikut ter-commit ke git). Saat aplikasi desktop dijalankan, database SQLite disimpan di folder data milik user (`%APPDATA%\Toko POS\toko.db` di Windows), bukan di dalam folder instalasi, supaya tetap bisa ditulis walau di-install di `Program Files`.

## Struktur Proyek

```
electron/
  main.js           # Entry point aplikasi desktop: start server + buka jendela
server/
  index.js          # Express app + fungsi start() (dipakai oleh npm start & Electron)
  db.js             # Koneksi SQLite (node:sqlite), schema, seed data
  middleware/auth.js
  routes/
    auth.js         # login/logout/me
    products.js      # CRUD produk
    transactions.js  # checkout & riwayat transaksi
    dashboard.js      # ringkasan dashboard
public/
  index.html        # halaman login
  dashboard.html
  pos.html          # halaman kasir
  products.html
  reports.html
  css/style.css
  js/api.js         # helper fetch + format
  js/layout.js       # sidebar + auth guard
```

## Catatan

- Database berupa file SQLite lokal (`server/data/toko.db`), cocok untuk satu toko dengan beberapa kasir yang mengakses dari jaringan yang sama. Untuk skala lebih besar (banyak cabang/toko), pertimbangkan migrasi ke PostgreSQL/MySQL.
- Ganti `SESSION_SECRET` di environment variable sebelum digunakan secara produksi.
