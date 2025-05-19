# Tasker Bot: Aplikasi Manajemen Tugas

Selamat datang di **Tasker Bot**, sebuah aplikasi manajemen tugas inovatif yang dirancang untuk menyederhanakan pengelolaan tugas bagi **Admin** dan **Operator**. Aplikasi ini dibangun dengan teknologi modern seperti **Next.js 14 App Router**, **TypeScript**, dan didukung oleh **Supabase** sebagai *backend* serta **Gemini AI** untuk fitur cerdas.

## Fitur Utama

  * **Manajemen Tugas Komprehensif**: Buat, tetapkan, lacak, dan kelola tugas dengan mudah.
  * **Peran Pengguna**:
      * **Admin**: Memiliki kontrol penuh atas semua tugas dan pengguna, termasuk penugasan tugas kepada operator dan melihat laporan kinerja.
      * **Operator**: Dapat melihat tugas yang ditugaskan, memperbarui status tugas, dan berinteraksi dengan **Tasker Bot**.
  * **Tasker Bot Integrasi**: Bot pintar yang membantu dalam pembuatan tugas, pengingat, dan pembaruan status melalui interaksi berbasis AI.
  * **Otentikasi Aman**: Didukung oleh Supabase untuk otentikasi pengguna yang aman dan mudah.
  * **Antarmuka Pengguna Modern**: Dibangun dengan Next.js 14 App Router untuk pengalaman pengguna yang cepat dan responsif.

## Memulai

Untuk menjalankan project ini secara lokal, ikuti langkah-langkah berikut:

### Persyaratan

Pastikan Anda telah menginstal:

  * Node.js (versi 18 atau lebih tinggi)
  * npm, yarn, pnpm, atau bun

### Konfigurasi Lingkungan

1.  **Kloning Repositori**:

    ```bash
    git clone [URL_REPOSITORI_ANDA]
    cd [NAMA_FOLDER_PROJECT]
    ```

2.  **Instal Dependensi**:
    Pilih manajer paket favorit Anda:

    ```bash
    npm install
    # atau
    yarn install
    # atau
    pnpm install
    # atau
    bun install
    ```

3.  **Siapkan Variabel Lingkungan**:
    Buat file `.env.local` di root project Anda dan tambahkan variabel lingkungan Supabase dan Gemini AI Anda:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

    Ganti placeholder dengan kredensial Supabase dan Gemini AI Anda yang sebenarnya.

### Menjalankan Server Pengembangan

Setelah konfigurasi selesai, jalankan server pengembangan:

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

Buka [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) di browser Anda untuk melihat hasilnya. Anda dapat mulai mengedit halaman dengan memodifikasi `app/page.tsx`. Halaman akan otomatis diperbarui saat Anda mengedit file.

## Struktur Project

Project ini menggunakan Next.js App Router, yang memungkinkan Anda untuk mengatur rute berdasarkan struktur folder di direktori `app/`.

  * **`app/`**: Berisi semua rute dan komponen UI utama aplikasi.
  * **`components/`**: Komponen UI yang dapat digunakan kembali di seluruh aplikasi.
  * **`utils/`**: Fungsi utilitas atau *helper*, termasuk konfigurasi Supabase dan integrasi Gemini AI.
  * **`types/`**: Definisi tipe TypeScript untuk data aplikasi.

Project ini menggunakan [`next/font`](https://www.google.com/search?q=%5Bhttps://nextjs.org/docs/app/building-your-application/optimizing/fonts%5D\(https://nextjs.org/docs/app/building-your-application/optimizing/fonts\)) untuk mengoptimalkan dan memuat font secara otomatis, termasuk [Geist](https://vercel.com/font).

## Pelajari Lebih Lanjut

Untuk informasi lebih lanjut tentang Next.js, lihat sumber daya berikut:

  * [Dokumentasi Next.js](https://nextjs.org/docs) - Pelajari tentang fitur dan API Next.js.
  * [Belajar Next.js](https://nextjs.org/learn) - Tutorial Next.js interaktif.

Anda juga dapat melihat [repositori GitHub Next.js](https://github.com/vercel/next.js) — umpan balik dan kontribusi Anda sangat diterima\!

## Deploy di Vercel

Cara termudah untuk mendeploy aplikasi Next.js Anda adalah dengan menggunakan [Platform Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) dari para pembuat Next.js.

Lihat [dokumentasi deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) kami untuk detail lebih lanjut.