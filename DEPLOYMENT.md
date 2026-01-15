# Panduan Deployment ke Vercel

Untuk mendapatkan link website yang bisa diakses orang lain (misal: `kotatsu-web.vercel.app`), kamu perlu melakukan deployment. **Vercel** adalah tempat hosting gratis terbaik untuk aplikasi Next.js.

## Langkah-langkah:

1. **Buka Vercel**
   - Kunjungi [vercel.com](https://vercel.com)
   - Login menggunakan akun **GitHub** kamu.

2. **Import Project**
   - Di dashboard Vercel, klik tombol **"Add New..."** -> **"Project"**
   - Di bagian "Import Git Repository", cari `kotatsu-web`
   - Klik tombol **Import** di sebelahnya

3. **Konfigurasi (Default)**
   - Framework Preset: `Next.js` (biasanya otomatis terdeteksi)
   - Root Directory: `./` (biarkan default)
   - Environment Variables: Kosongkan (kecuali kamu nanti perlu API key khusus)
   - Klik **Deploy**

4. **Tunggu Proses**
   - Vercel akan membangun (build) aplikasi kamu (sekitar 1-2 menit)
   - Jika berhasil, layar akan menampilkan screenshot website kamu

5. **Selesai!**
   - Kamu akan mendapatkan link domain (contoh: `kotatsu-web.vercel.app`)
   - Klik tombol **"Go to Dashboard"** untuk melihat detailnya

## Update Otomatis
Setiap kali kamu melakukan `git push` perubahan baru ke GitHub, Vercel akan **otomatis** mendeteksi dan mengupdate website kamu dalam beberapa menit.
