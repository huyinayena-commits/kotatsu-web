# Kotatsu Web - Reader Komik Modern

Web aplikasi modern untuk membaca komik (Manga/Manhwa/Manhua) dengan antarmuka yang bersih, responsif, dan performa tinggi. Proyek ini dibangun sebagai front-end reader yang mengambil sumber data dari berbagai situs komik (Scraper).

## 🛠️ Teknologi & Bahasa Pemrograman

Web ini dibangun menggunakan **TypeScript** sebagai bahasa utama, berjalan di atas framework **Next.js**.

### Tech Stack Utama
*   **Bahasa**: TypeScript, HTML, CSS
*   **Framework**: Next.js 16 (React 19)
*   **Styling**: Tailwind CSS v4
*   **Runtime**: Node.js

## 📚 Library yang Digunakan

Berikut adalah detail library yang digunakan untuk menunjang fitur-fitur UI/UX premium di web ini:

### Core & Data
*   **`axios`**: Melakukan HTTP request ke sumber komik.
*   **`cheerio`**: Parsing HTML (Scraping) untuk mengambil data chapter dan gambar dari website target.
*   **`@tanstack/react-query`**: Library untuk data fetching dan caching client-side. Menyediakan caching otomatis, background refetching, dan state management untuk async data.
*   **`dayjs`**: Library manipulasi tanggal/waktu yang sangat ringan (2kB). Dengan plugin `relativeTime`, menampilkan waktu relatif seperti "5 menit yang lalu" atau "Baru saja".
*   **`zod`**: Schema validation untuk memastikan data dari scraper sesuai format yang diharapkan. Mencegah crash akibat perubahan struktur HTML di situs sumber.
*   **`react-hook-form`**: Library form handling dengan performa tinggi. Meminimalisir re-render saat user mengetik, menjaga FPS tetap tinggi. Terintegrasi dengan Zod via `@hookform/resolvers`.

### User Interface (UI)
*   **`lucide-react`**: Koleksi ikon SVG yang konsisten dan ringan.
*   **`react-hot-toast`**: Menampilkan notifikasi (Toast) yang cantik dan tidak mengganggu.

### UX Enhancements (Peningkatan Pengalaman)
*   **`lenis`**: Memberikan efek *Smooth Scrolling* berbasis fisika agar scroll terasa mahal dan mulus di semua device.
*   **`overlayscrollbars-react`**: Mengganti scrollbar browser bawaan dengan custom scrollbar yang minimalis dan bertema gelap (OverlayScrollbars).
*   **`@formkit/auto-animate`**: Memberikan animasi otomatis yang halus saat ada perubahan pada list (seperti grid manga atau daftar chapter).

### Performance Optimization (Optimasi Performa)
*   **`million`**: React Virtual DOM compiler yang membuat komponen React hingga 70% lebih cepat menggunakan teknik *Block Virtual DOM*. Mengubah kompleksitas update dari O(n) menjadi O(1).

### Reader Optimization (Fitur Baca)
*   **`vanilla-lazyload`**: Memuat gambar hanya saat dibutuhkan (Lazy Loading) untuk menghemat data dan mempercepat loading halaman panjang.
*   **`react-cool-inview`**: Mendeteksi chapter mana yang sedang dibaca pengguna secara akurat untuk memperbarui History dan URL secara otomatis.
*   **`@use-gesture/react`**: Menangani interaksi sentuh, seperti fitur *Swipe* untuk ganti chapter.

## 🚀 Fitur Unggulan
1.  **Immersive Reader**: Mode baca Webtoon (Scroll) dan Pager (Per halaman) dengan fokus penuh pada konten.
2.  **Smooth Experience**: Navigasi dan scroll yang sangat mulus berkat Lenis dan optimasi React.
3.  **Smart History**: Otomatis menyimpan progress bacaan terakhir.
4.  **Responsive**: Tampilan yang menyesuaikan dengan sempurna baik di HP, Tablet, maupun Laptop.

---
*Dibuat untuk pengalaman membaca yang lebih baik.*
