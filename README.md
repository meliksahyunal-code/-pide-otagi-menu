# 🍽️ Pide Otağı - QR Menü ve Sipariş Yönetim Sistemi

Modern, kullanıcı dostu bir QR kod menü sistemi ve garson sipariş yönetim paneli.

## 📋 Özellikler

### Müşteri Menüsü (index.html)
- ✨ Modern ve premium tasarım
- 📱 Mobil uyumlu responsive tasarım
- 🌙 Koyu tema (dark mode)
- 💫 Glassmorphism efektleri ve animasyonlar
- 🍕 Tüm pide çeşitleri ve fiyatları
- 🥤 İçecek seçenekleri

### Garson Yönetim Paneli (admin.html)
- 🪑 Masa bazlı sipariş yönetimi (15 masa)
- ➕ Kolay sipariş oluşturma
- 📊 Aktif siparişleri görüntüleme
- 🔄 Sipariş durumu güncelleme (Beklemede → Hazırlanıyor → Tamamlandı)
- 💾 **Backend API ile veri saklama** (MongoDB)
- 💰 Otomatik toplam hesaplama
- 🔄 Gerçek zamanlı senkronizasyon (her 30 saniye)
- 👥 Çoklu cihaz desteği

## 🏗️ Mimari

```
Frontend (HTML/CSS/JS) 
    ↓
Backend API (Node.js + Express)
    ↓
Database (MongoDB Atlas)
```

## 🚀 Kurulum

### 1. Backend Kurulumu

```bash
cd backend

# Bağımlılıkları kur
npm install

# Environment variables ayarla
cp .env.example .env
# .env dosyasını düzenle, MongoDB connection string'i ekle

# Server'ı başlat
npm start
```

Backend şu adreste çalışacak: `http://localhost:3000`

### 2. Frontend Kurulumu

```bash
# Proje ana dizininde local server başlat
npx -y http-server -p 8080

# Tarayıcıda aç:
# Müşteri Menüsü: http://localhost:8080/index.html
# Garson Paneli: http://localhost:8080/admin.html
```

## 📁 Dosya Yapısı

```
pide-otagi-menu/
├── backend/
│   ├── models/
│   │   └── Order.js          # MongoDB sipariş modeli
│   ├── server.js             # Express API server
│   ├── package.json          # Backend dependencies
│   ├── .env.example          # Environment variables şablonu
│   └── .env                  # Environment variables (gitignore)
├── index.html                # Müşteri menü sayfası
├── admin.html                # Garson sipariş paneli
├── styles.css                # Tüm stil tanımlamaları
├── menu.js                   # Menü verileri
├── admin.js                  # Sipariş yönetimi (API entegrasyonu)
├── config.js                 # API konfigürasyonu
├── DEPLOYMENT.md             # Deploy rehberi
└── README.md                 # Bu dosya
```

## 🌐 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Health check |
| GET | `/api/orders` | Tüm siparişleri getir |
| GET | `/api/orders/active` | Aktif siparişleri getir |
| GET | `/api/orders/:id` | Belirli siparişi getir |
| POST | `/api/orders` | Yeni sipariş oluştur |
| PUT | `/api/orders/:id` | Sipariş durumunu güncelle |
| DELETE | `/api/orders/:id` | Sipariş sil |

## 🗄️ MongoDB Atlas Kurulumu

Detaylı rehber için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasına bakın.

**Hızlı başlangıç:**
1. https://www.mongodb.com/cloud/atlas adresine git
2. Ücretsiz hesap oluştur
3. M0 (ücretsiz) cluster oluştur
4. Database user ekle
5. Network access ayarla (0.0.0.0/0 - Allow from anywhere)
6. Connection string al ve `.env` dosyasına ekle

## 🚢 Deployment

### Backend: Render (✅ Deployed)
**Production URL:** https://pide-otagi-menu.onrender.com

### Frontend: Cloudflare Pages (Önerilir - Türkiye'den erişilebilir)
- ♾️ **Unlimited bandwidth** ve **unlimited builds**
- 🔒 Ücretsiz DDoS koruması
- ⚡ Türkiye dahil 300+ şehirde CDN

Detaylı deployment rehberi için [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) dosyasına bakın.

## 💻 Geliştirme

### Backend geliştirme modu

```bash
cd backend
npm install -g nodemon  # İlk seferinde
npm run dev
```

### API Test

```bash
# Health check
curl http://localhost:3000

# Siparişleri getir
curl http://localhost:3000/api/orders

# Yeni sipariş oluştur
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "5",
    "items": [
      {"id": 1, "name": "Çökeleği Pide", "price": 130, "quantity": 2}
    ]
  }'
```

## 📊 Menü İçeriği

### Pide Çeşitleri
- Çökeleği Pide - 130₺
- Kıymalı Pide - 140₺
- Kuşbaşılı Pide - 200₺
- Patatesli Pide - 130₺
- Karışık Pide - 230₺
- Kuşbaşı Kaşarlı Pide - 230₺
- Kıymalı Kaşarlı Pide - 180₺

### İçecekler
- Ayran - 25₺
- Kola Kutu - 25₺
- Kola Şişe - 40₺
- Gazlı İçecek - 40₺
- Meyve Suyu - 60₺
- Fanta Suyu - 30₺
- Gazoz - 30₺
- İcetea - 30₺
- Su - 17₺
- Doğal Çay - 20₺

## 🔧 Özelleştirme

### Masa Sayısını Değiştirme
`admin.html` dosyasındaki `<select id="tableNumber">` elementini düzenleyin.

### Menü Ürünlerini Güncelleme
`menu.js` ve `admin.js` dosyalarındaki `menuData` objesini düzenleyin.

### API URL Değiştirme
`config.js` dosyasındaki URL'leri güncelleyin.

## 🆘 Sorun Giderme

**Backend çalışmıyor:**
- MongoDB connection string doğru mu?
- Port 3000 kullanımda mı? Başka port deneyin
- `npm install` çalıştırdınız mı?

**Frontend API'ye bağlanamıyor:**
- Backend çalışıyor mu? `http://localhost:3000` kontrol edin
- `config.js`'de API URL doğru mu?
- CORS hatası varsa backend'de CORS middleware kontrol edin

**Siparişler kaydedilmiyor:**
- MongoDB bağlantısı aktif mi?
- Browser console'da hata var mı? (F12)
- Network sekmesinde API çağrıları başarılı mı?

## 📱 QR Kod Oluşturma

1. Frontend'i deploy edin (Cloudflare Pages)
2. `index.html` URL'ini alın (örn: `https://pide-otagi-menu.pages.dev`)
3. QR kod oluşturucu kullanın: https://www.qr-code-generator.com/
4. QR kodu yazdırıp masalara yerleştirin

## 🎯 Gelecek Geliştirmeler

- [ ] Socket.io ile gerçek zamanlı bildirimler
- [ ] Mutfak ekranı
- [ ] Raporlama ve istatistikler
- [ ] Masa düzeni görselleştirme
- [ ] Çoklu restoran desteği
- [ ] Mobil uygulama

## 📞 İletişim

**Pide Otağı - Mazhar Garıboğlu Pidesi**  
Rezervasyon: 0850 711 6008

---

**✨ Afiyet olsun! ✨**
