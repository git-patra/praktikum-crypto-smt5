# Tugas 3 — Data Cryptocurrency

Aplikasi daftar cryptocurrency menggunakan Vue 3, Ionic Vue, dan TypeScript. Data diambil melalui Axios dari CoinLore dan ditampilkan dengan 10 data per halaman.

## Identitas

- Nama: Anugrah Patra Nurdiansyah
- NIM: 050145804
- Program studi: Sistem Informasi
- Universitas: Universitas Terbuka Bandung
- Mata kuliah: PEMROGRAMAN BERBASIS PERANGKAT BERGERAK/STSI4303

## Sumber Data

https://api.coinlore.net/api/tickers/

Data yang ditampilkan adalah `rank` (peringkat), `name` (nama), `symbol` (simbol), dan `price_usd` (harga dalam USD). Gunakan tombol Sebelumnya dan Berikutnya untuk berpindah halaman. Tombol Refresh mengambil data terbaru dan mengembalikan tampilan ke halaman pertama.

## Menjalankan Aplikasi

Gunakan Node.js versi 20.19.0 atau lebih baru. Jalankan perintah berikut dari folder proyek:

```bash
npm ci
npm run dev
```

Buka http://127.0.0.1:5176/. Koneksi internet diperlukan untuk mengambil data API. Tekan Ctrl+C di terminal untuk menghentikan aplikasi.

## Pengujian dan Build

```bash
npm test
npm run build
npm run preview
```

Hasil build tersimpan di folder `dist`. Preview dapat dibuka di http://127.0.0.1:4176/.

## Struktur Program

- `src/main.ts`: inisialisasi Vue, IonicVue, dan VueAxios.
- `src/App.vue`: tampilan Ionic, pengambilan data, dan pagination.
- `src/crypto.ts`: tipe data, validasi respons, dan akses API menggunakan Axios.
- `src/style.css`: pengaturan tampilan.
- `src/App.test.ts` dan `src/crypto.test.ts`: pengujian aplikasi.
