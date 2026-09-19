# Toko POS

Aplikasi kasir (POS) sederhana untuk toko: manajemen produk, transaksi kasir, dan laporan penjualan. Backend Node.js/Express dengan database SQLite, frontend HTML/CSS/JS biasa (tanpa framework/build step).

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

## Struktur Proyek

```
server/
  index.js          # Entry point Express + session
  db.js             # Koneksi SQLite, schema, seed data
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
