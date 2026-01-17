# 🚀 Pide Otağı - Backend Deployment Rehberi

## Railway.app ile Deployment (Önerilen)

### 1. Railway Hesabı Oluştur
1. https://railway.app adresine git
2. GitHub hesabınızla giriş yap
3. "New Project" butonuna tıkla

### 2. Projeyi Deploy Et

#### Opsiyon A: GitHub ile (Önerilen)
1. Projeyi GitHub'a yükle
2. Railway'de "Deploy from GitHub repo" seç
3. Repository'nizi seç
4. `backend` klasörünü root olarak seç

#### Opsiyon B: CLI ile
```bash
# Railway CLI kur
npm install -g @railway/cli

# Login
railway login

# Proje oluştur
railway init

# Deploy et
cd backend
railway up
```

### 3. Environment Variables Ekle
Railway dashboard'da:
1. Variables sekmesine git
2. Şu değişkenleri ekle:
   ```
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   PORT=3000
   ```

### 4. Domain Al
1. Railway otomatik domain verir: `your-app.up.railway.app`
2. Bu URL'yi kopyala
3. `config.js` dosyasında production API_URL'i güncelle

---

## Render.com ile Deployment (Alternatif)

### 1. Render Hesabı Oluştur
1. https://render.com adresine git
2. GitHub hesabınızla giriş yap

### 2. Web Service Oluştur
1. "New +" → "Web Service"
2. GitHub repository'ni bağla
3. Ayarlar:
   - **Name**: pide-otagi-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Environment Variables
```
MONGODB_URI=<your-mongodb-atlas-connection-string>
```

### 4. Deploy
- "Create Web Service" butonuna tıkla
- Deploy otomatik başlar
- URL: `pide-otagi-backend.onrender.com`

---

## MongoDB Atlas Kurulumu

### 1. Hesap Oluştur
1. https://www.mongodb.com/cloud/atlas adresine git
2. "Try Free" ile hesap aç

### 2. Cluster Oluştur
1. FREE tier seç (M0)
2. Cloud Provider: AWS
3. Region: En yakın bölge (örn: Frankfurt)
4. Cluster Name: pide-otagi

### 3. Database User Oluştur
1. Security → Database Access
2. "Add New Database User"
3. Username ve şifre belirle (güçlü şifre kullan)
4. Built-in Role: "Atlas admin" seç

### 4. Network Access
1. Security → Network Access
2. "Add IP Address"
3. "Allow Access from Anywhere" (0.0.0.0/0) seç
   - Production'da daha güvenli olması için Railway/Render IP'lerini ekleyebilirsiniz

### 5. Connection String Al
1. Database → Connect
2. "Connect your application" seç
3. Driver: Node.js
4. Connection string'i kopyala:
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/pide-otagi?retryWrites=true&w=majority
   ```
5. `<password>` kısmını gerçek şifrenizle değiştirin

---

## Yerel Test

Backend'i yerel olarak test etmek için:

```bash
cd backend

# Bağımlılıkları kur
npm install

# .env dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle, MongoDB URI'yi ekle
# nano .env veya notepad .env

# Server'ı başlat
npm start
```

Backend şu adreste çalışacak: http://localhost:3000

---

## Frontend'i Güncelle

Backend deploy edildikten sonra:

1. `config.js` dosyasını aç
2. Production API_URL'i güncelle:
   ```javascript
   production: {
     API_URL: 'https://your-app-name.up.railway.app/api'
     // veya
     // API_URL: 'https://pide-otagi-backend.onrender.com/api'
   }
   ```

3. Frontend'i deploy et (Netlify/Vercel)

---

## Test Etme

### Backend Health Check
```bash
# Railway
curl https://your-app.up.railway.app

# Render  
curl https://pide-otagi-backend.onrender.com
```

Yanıt:
```json
{
  "message": "🍕 Pide Otağı API çalışıyor!",
  "version": "1.0.0"
}
```

### API Test
```bash
# Tüm siparişleri getir
curl https://your-app.up.railway.app/api/orders
```

---

## Sorun Giderme

### Railway Logs
```bash
railway logs
```

### Render Logs
Render dashboard → Logs sekmesi

### Yaygın Hatalar

**MongoDB bağlantı hatası:**
- MONGODB_URI doğru mu kontrol et
- MongoDB Atlas'ta IP whitelist kontrolü yap
- Kullanıcı adı ve şifre doğru mu?

**CORS hatası:**
- Backend CORS middleware eklenmiş mi kontrol et
- Frontend URL'i doğru mu?

**Deploy başarısız:**
- package.json var mı?
- Node.js versiyonu uyumlu mu?

---

## Maliyet

- **MongoDB Atlas**: Ücretsiz (512MB)
- **Railway**: Ayda $5 kredi (ücretsiz başlangıç)
- **Render**: Free tier (uyku modu, soğuk başlatma var)

**Öneri**: Küçük restoranlar için Railway + MongoDB Atlas kombinasyonu ideal
