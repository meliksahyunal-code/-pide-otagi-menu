# 🚀 Netlify Frontend Deployment Rehberi

Backend zaten Render'da çalışıyor: **https://pide-otagi-menu.onrender.com**  
Şimdi frontend'i Netlify'a deploy edeceğiz.

---

## Seçenek 1: Netlify UI ile (Kolay - Önerilen)

### Adım 1: Netlify'a Giriş
1. https://netlify.com adresine git
2. **"Sign up"** veya **"Log in"** (GitHub ile giriş yapın)

### Adım 2: Yeni Site Ekle
1. **"Add new site"** → **"Import an existing project"**
2. **"Deploy with GitHub"** seç
3. GitHub'a izin ver (ilk seferinde)
4. Repository seç: **`-pide-otagi-menu`**

### Adım 3: Build Settings
Şu ayarları yapın:

| Alan | Değer |
|------|-------|
| **Branch to deploy** | `main` |
| **Build command** | (boş bırak) |
| **Publish directory** | `.` |

> Backend klasörü deploy edilmeyecek - sadece frontend dosyaları (HTML/CSS/JS) deploy edilir.

### Adım 4: Deploy!
1. **"Deploy site"** butonuna tıkla
2. 1-2 dakika bekle
3. Site canlı olacak!

### Adım 5: URL'yi Al
1. Deploy tamamlandığında rastgele bir URL alacaksınız:
   ```
   https://random-name-123456.netlify.app
   ```
2. Site name'i değiştirmek için:
   - **Site settings** → **Change site name**
   - Örnek: `pide-otagi` → `https://pide-otagi.netlify.app`

---

## Seçenek 2: Netlify CLI ile

```bash
# Netlify CLI kur (global)
npm install -g netlify-cli

# Login
netlify login

# Deploy et (test)
netlify deploy

# Production deploy
netlify deploy --prod
```

CLI ile deploy ederken:
- Publish directory: `.` girin
- Browser'da açılan pencerede authorize edin

---

## Test

Deploy'dan sonra test edin:

### 1. Müşteri Menüsü
```
https://your-site.netlify.app/index.html
```
veya
```
https://your-site.netlify.app/
```

✅ Menü itemları görünmeli  
✅ Tasarım düzgün olmalı  
✅ Mobil uyumlu olmalı

### 2. Admin Paneli
```
https://your-site.netlify.app/admin.html
```

✅ Masa seçimi çalışmalı  
✅ Sipariş ekleme formu görünmeli  
✅ Backend bağlantısı çalışmalı

### 3. Backend Bağlantısı Test
1. Admin panelinde sipariş oluşturun
2. Browser Console'u açın (F12)
3. Network sekmesinde API çağrılarını kontrol edin
4. `https://pide-otagi-menu.onrender.com/api/orders` başarılı olmalı

---

## QR Kod Oluşturma

Site deploy olduktan sonra:

1. Deployed URL'inizi alın: `https://pide-otagi.netlify.app`
2. QR kod oluşturucu kullanın:
   - https://www.qr-code-generator.com/
   - https://qr.io/
3. URL'yi girin ve QR kodu indirin
4. QR kodları yazdırıp masalara yerleştirin

**Tip:** Her masa için ayrı QR kod yapabilirsiniz:
- Masa 1: `https://pide-otagi.netlify.app/?table=1`
- Masa 2: `https://pide-otagi.netlify.app/?table=2`

(Gelecekte URL parametresinden masa numarasını otomatik çekecek şekilde kod geliştirebilirsiniz)

---

## Continuous Deployment

Netlify otomatik deployment yapılandırıldı:

✅ `main` branch'e her push'ta otomatik deploy  
✅ Build hatası varsa deploy olmaz  
✅ Preview deployment (pull request için)  

Kod değişikliği yaptığınızda:
```bash
git add .
git commit -m "Güncelleme"
git push origin main
```

Netlify otomatik deploy eder! 🚀

---

## Custom Domain (Opsiyonel)

Kendi domain'iniz varsa (örn: `pideotagi.com`):

1. Netlify → **Domain settings**
2. **Add custom domain**
3. DNS ayarlarını yapın (Netlify talimatları verir)
4. SSL otomatik aktif olur

---

## Sorun Giderme

### Site açılmıyor
- ✅ Deploy tamamlandı mı? (Netlify dashboard'da kontrol edin)
- ✅ URL doğru mu?

### Admin paneli backend'e bağlanamıyor
- ✅ Browser console'da hata var mı?
- ✅ CORS hatası mı? (Backend CORS ayarları doğru olmalı)
- ✅ Backend çalışıyor mu? Test edin: https://pide-otagi-menu.onrender.com/

### Stil bozuk görünüyor
- ✅ styles.css dosyası deploy edildi mi?
- ✅ Browser cache'i temizleyin (Ctrl+Shift+R)

---

## Netlify Özellikleri (Ücretsiz)

✅ **100 GB bandwidth/ay**  
✅ **Unlimited deployments**  
✅ **Auto SSL (HTTPS)**  
✅ **Global CDN**  
✅ **Continuous deployment**  
✅ **Form handling** (ilerde iletişim formu için)  
✅ **Serverless functions** (ilerde backend geliştirmek için)  

---

**Deploy ettikten sonra URL'inizi paylaşın, birlikte test edelim! 🎉**
