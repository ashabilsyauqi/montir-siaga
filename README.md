# 🚗 Montir Siaga — 3 Level User Architecture (Gojek Model)

Aplikasi *on-demand roadside emergency mechanic dispatch* yang dibangun khusus untuk smartphone menggunakan **React Native** & **Expo**.

---

## 👥 3 Level Pengguna (Role-Based Testing)

Di bagian atas layar aplikasi, terdapat **Role Switcher Bar** instan untuk menguji alur sistem secara langsung di HP:

### 1. 🚗 Driver Mobil (Pengguna / Pelanggan)
* **Koneksi GPS Asli Smartphone (`expo-location`):** Mendeteksi koordinat latitude/longitude perangkat Anda dan otomatis menerjemahkannya ke nama jalan & kecamatan (*reverse geocoding*).
* **Pemilihan Masalah Darurat:** 6 kategori kendala (*Aki Soak, Ban Bocor, Mesin Mati, Overheat, BBM Habis, Towing Truk*) dengan transparansi tarif.
* **Broadcast Panggilan:** Radar pemindaian mencari montir bersertifikat di radius 3-5 km.
* **Live Tracking & Komunikasi:** Memantau pergerakan montir secara langsung di peta, fitur Chat & Telepon.
* **Pembayaran Standar:** Dukungan pembayaran QRIS instan, Tunai (Cash ke Montir), dan E-Wallet.

### 2. 🔧 Mekanik (Mitra Kerja seperti Driver Gojek)
* **Status Kerja:** Switch *Online / Siaga* vs *Offline / Istirahat*.
* **Pop-up Pesanan Darurat Masuk:** Memunculkan notifikasi order darurat dengan info titik jemput mobil, jarak, keluhan pengemudi, dan tarif bersih montir (85%).
* **Alur Penanganan Lapangan (Job Stepper):**
  1. *Saya Sudah Tiba di Lokasi Mobil*
  2. *Mulai Diagnostik & Perbaikan*
  3. *Perbaikan Selesai (Kirim Nota ke Driver)*
* **Dompet Mitra (Wallet):** Melihat saldo pendapatan komisi 85% dan simulasi penarikan dana ke rekening bank.

### 3. 👑 Owner Aplikasi (Super Admin / Anda)
* **Ringkasan Finansial Platform:**
  - Total Perputaran Uang Jasa (GMV).
  - Keuntungan Bersih Owner (Komisi Platform 15% dari setiap pesanan).
  - Total volume order dan tingkat keberhasilan.
* **Live Order Monitor:** Memantau pesanan yang sedang berjalan di jalan raya secara *real-time*.
* **Approval & Verifikasi Montir:** Menyetujui atau mencabut lisensi mitra mekanik baru (verifikasi sertifikat keahlian, KTP, dan kendaraan operasional).

---

## 📲 Cara Menjalankan & Testing di Smartphone

1. Install aplikasi **Expo Go** dari App Store (iPhone) atau Google Play Store (Android).
2. Di Terminal Mac Anda, jalankan:
   ```bash
   cd ~/Documents/Ngoprek/montir-siaga
   npx expo start
   ```
3. Scan QR Code yang muncul di layar Mac menggunakan kamera iPhone atau aplikasi Expo Go di Android.
4. Aplikasi akan langsung menyala di smartphone Anda dengan izin GPS satelit aktif!
