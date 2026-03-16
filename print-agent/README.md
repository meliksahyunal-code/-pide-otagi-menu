# 🖨️ Pide Otağı — Print Agent Kurulum Rehberi

## Gerekli Donanım
- Bilgisayar (Windows)
- XPRINTER XP-Q80A (USB kabloyla PC'ye bağlı)
- İnternet (telefon hotspot üzerinden)

## Ağ Kurulumu

```
Telefon (Hotspot açık)
    │
    │ Wi-Fi
    └── Bilgisayar (internet için)
          │
          │ USB Kablosu
          └── XPRINTER XP-Q80A
```

1. Telefonda hotspot aç
2. Bilgisayarı telefon hotspot'una bağla (Wi-Fi)
3. Yazıcıyı USB ile bilgisayara bağla
4. Yazıcıyı aç → Windows bunu otomatik tanır

## Print Agent Kurulumu

### 1. Node.js kur (eğer yoksa)
https://nodejs.org → LTS sürümü indir ve kur

### 2. Print Agent klasörüne gel
```powershell
cd "C:\Users\GAME GARAJ\.gemini\antigravity\scratch\pide-otagi-menu\print-agent"
```

### 3. Paketleri yükle
```powershell
npm install
```

### 4. .env dosyası oluştur
`.env.example` dosyasını kopyala → `.env` olarak kaydet

```env
API_URL=https://pide-otagi-backend.onrender.com
PRINTER_TYPE=usb
POLL_INTERVAL=3000
```

> **Not:** API_URL'i Render.com'daki backend adresinle değiştir.

### 5. Yazıcı testi
```powershell
node test-print.js
```
Yazıcıdan test fişi çıkmalı.

### 6. Servisi başlat
```powershell
node agent.js
```

Ekranda şunu görmelisin:
```
╔══════════════════════════════════════╗
║   PİDE OTAĞI — PRİNT AGENT v1.0     ║
╚══════════════════════════════════════╝
📡 API: https://...onrender.com
⏱️  Kontrol aralığı: 3 saniye
🖨️  Yazıcı modu: USB
✅ Servis başladı. Ctrl+C ile durdurun.
```

## Windows'ta Otomatik Başlatma (İsteğe Bağlı)

Bilgisayar her açıldığında Print Agent otomatik başlasın:

1. `Win + R` → `shell:startup` yaz → Enter
2. Bu klasöre `start_print_agent.bat` dosyası oluştur:

```bat
@echo off
cd /d "C:\Users\GAME GARAJ\.gemini\antigravity\scratch\pide-otagi-menu\print-agent"
node agent.js
```

3. Dosyayı kaydet → Artık Windows açıldığında otomatik başlar

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| "Yazıcıya bağlanılamadı" | USB kablosunu çıkar tak, yazıcıyı yeniden başlat |
| "API hatası: 503" | Render.com uyumuş olabilir, site açarak uyandır |
| Türkçe karakterler bozuk | `node-thermal-printer` PC857_TURKISH charset kullanıyor, yazıcı sürücüsünü güncelle |
| Fiş çift basılıyor | Hiçbir şey yapma, sadece bir kez basar (mark-printed koruması var) |

## Backend Deploy (Render.com)

Kod değişikliklerini deploy et:
```powershell
cd "C:\Users\GAME GARAJ\.gemini\antigravity\scratch\pide-otagi-menu"
git add .
git commit -m "feat: yazici entegrasyonu - printed field, mark-printed endpoint, orderNumber"
git push
```

Render.com otomatik deploy başlar (~2-3 dakika).

## Frontend Deploy (Cloudflare Pages)

Cloudflare Pages, Git push'la otomatik deploy yapar:
```powershell
git add admin.js
git commit -m "feat: mutfak onay akisi kaldirildi, fis sistemi entegre edildi"
git push
```
