/**
 * Pide Otağı — Print Agent v2.0
 *
 * Çalışma mantığı:
 * - Her 3 saniyede printed:false olan siparişleri çeker
 * - Siparişte pide varsa → fiş basar (TCP/Ethernet üzerinden)
 * - Siparişte sadece içecek varsa → fişsiz, direkt printed:true yapar
 * - Her 10 dakikada Render.com'a ping atar (backend uyumasın)
 * - Yazıcıya ulaşılamazsa 5 kez retry yapar, sonra sıradaki turda tekrar dener
 *
 * Kurulum:
 *   1. npm install
 *   2. .env dosyasını düzenle (API_URL, PRINTER_IP)
 *   3. node agent.js
 */

require('dotenv').config();
const net = require('net');
const fetch = require('node-fetch');

// ─── Ayarlar ────────────────────────────────────────────────────────────────
const API_URL        = process.env.API_URL       || 'https://pide-otagi-backend.onrender.com';
const PRINTER_IP     = process.env.PRINTER_IP    || '192.168.123.100';
const PRINTER_PORT   = parseInt(process.env.PRINTER_PORT) || 9100;
const POLL_INTERVAL  = parseInt(process.env.POLL_INTERVAL) || 3000;   // ms
const PING_INTERVAL  = 10 * 60 * 1000;  // 10 dakika

// Pide ID'leri: 1-7
const isPide = (id) => id >= 1 && id <= 7;

// ─── TCP ile Yazıcıya Bağlan ve Veri Gönder ──────────────────────────────────
function sendToprinter(buffer) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let connected = false;

        const timeout = setTimeout(() => {
            client.destroy();
            reject(new Error(`Yazıcı bağlantı zaman aşımı (${PRINTER_IP}:${PRINTER_PORT})`));
        }, 8000);

        client.connect(PRINTER_PORT, PRINTER_IP, () => {
            connected = true;
            client.write(buffer, (err) => {
                if (err) {
                    clearTimeout(timeout);
                    client.destroy();
                    return reject(err);
                }
                // Veriyi gönderince kapat
                setTimeout(() => {
                    clearTimeout(timeout);
                    client.end();
                    resolve(true);
                }, 500);
            });
        });

        client.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        client.on('close', () => {
            clearTimeout(timeout);
            if (!connected) reject(new Error('Bağlantı kapatıldı'));
            else resolve(true);
        });
    });
}

// ─── ESC/POS Komut Yardımcıları ──────────────────────────────────────────────
const ESC = 0x1B;
const GS  = 0x1D;

function cmd(...bytes) { return Buffer.from(bytes); }

const INIT           = cmd(ESC, 0x40);                  // Yazıcıyı sıfırla
const CUT            = cmd(GS, 0x56, 0x00);             // Kağıt kes
const BOLD_ON        = cmd(ESC, 0x45, 0x01);
const BOLD_OFF       = cmd(ESC, 0x45, 0x00);
const ALIGN_CENTER   = cmd(ESC, 0x61, 0x01);
const ALIGN_LEFT     = cmd(ESC, 0x61, 0x00);
const ALIGN_RIGHT    = cmd(ESC, 0x61, 0x02);
const DOUBLE_HEIGHT  = cmd(GS, 0x21, 0x11);             // 2x boy 2x en
const NORMAL_SIZE    = cmd(GS, 0x21, 0x00);
const LINE_FEED      = cmd(0x0A);

// Türkçe karakter dönüşümü (PC857 / IBM857 encoding)
function turkishEncode(str) {
    const map = {
        'ğ': '\xA7', 'Ğ': '\xD0',
        'ü': '\x81', 'Ü': '\x9A',
        'ş': '\x98', 'Ş': '\x8F',  // PC857'de
        'ı': '\x8D', 'İ': '\x98',
        'ö': '\x94', 'Ö': '\x99',
        'ç': '\x87', 'Ç': '\x80',
    };
    return str.replace(/[ğĞüÜşŞıİöÖçÇ]/g, c => map[c] || c);
}

function textBuf(str) {
    return Buffer.from(turkishEncode(str), 'binary');
}

function line(str = '') {
    return Buffer.concat([textBuf(str), LINE_FEED]);
}

function divider(char = '-', len = 32) {
    return line(char.repeat(len));
}

// Sağa hizalı fiyat satırı (toplam genişlik 32 karakter)
function priceRow(label, price, width = 32) {
    const priceStr = `${price} TL`;
    const labelLen = width - priceStr.length;
    const padded = label.substring(0, labelLen).padEnd(labelLen, ' ');
    return line(padded + priceStr);
}

// ─── Fiş Oluştur ─────────────────────────────────────────────────────────────
function buildReceipt(order) {
    const chunks = [];

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
    const orderNum = String(order.orderNumber || '?').padStart(3, '0');

    const pideItems  = order.items.filter(i => isPide(i.id));
    const drinkItems = order.items.filter(i => !isPide(i.id));

    // Başlık
    chunks.push(INIT);
    chunks.push(ALIGN_CENTER);
    chunks.push(BOLD_ON);
    chunks.push(DOUBLE_HEIGHT);
    chunks.push(line('PIDE OTAGI'));
    chunks.push(NORMAL_SIZE);
    chunks.push(BOLD_OFF);
    chunks.push(divider('='));

    // Masa & sıra
    chunks.push(ALIGN_LEFT);
    chunks.push(BOLD_ON);
    chunks.push(DOUBLE_HEIGHT);
    chunks.push(line(`MASA: ${order.tableNumber}`));
    chunks.push(NORMAL_SIZE);
    chunks.push(BOLD_OFF);
    chunks.push(line(`Siparis No: #${orderNum}   Saat: ${timeStr}`));
    chunks.push(line(`Tarih: ${dateStr}`));
    chunks.push(divider('-'));

    // Pideler — kişiye göre grupla
    if (pideItems.length > 0) {
        chunks.push(BOLD_ON);
        chunks.push(line('** PIDELER (FIRINDA) **'));
        chunks.push(BOLD_OFF);
        chunks.push(LINE_FEED);

        // Kişilere göre grupla
        const byPerson = {};
        pideItems.forEach(item => {
            const p = item.personNumber || 1;
            if (!byPerson[p]) byPerson[p] = [];
            byPerson[p].push(item);
        });

        Object.keys(byPerson).sort((a, b) => a - b).forEach(personNum => {
            const personItems = byPerson[personNum];

            if (Object.keys(byPerson).length > 1) {
                chunks.push(BOLD_ON);
                chunks.push(line(`--- Kisi ${personNum} ---`));
                chunks.push(BOLD_OFF);
            }

            personItems.forEach(item => {
                const portionText = getPortionText(item.quantity);
                chunks.push(BOLD_ON);
                chunks.push(line(`${item.quantity}x  ${item.name}`));
                chunks.push(BOLD_OFF);
                chunks.push(line(`    >>> ${portionText} <<<`));
                if (item.quantity === 0.5) {
                    chunks.push(line(`    NOT: Ortadan kes`));
                }
                chunks.push(LINE_FEED);
            });
        });
    }

    // İçecekler
    if (drinkItems.length > 0) {
        chunks.push(divider('-'));
        chunks.push(BOLD_ON);
        chunks.push(line('ICECEKLER (GARSON VERIR):'));
        chunks.push(BOLD_OFF);
        drinkItems.forEach(item => {
            chunks.push(line(`  ${item.quantity}x  ${item.name}`));
        });
        chunks.push(LINE_FEED);
    }

    // Toplam
    chunks.push(divider('='));
    const total = order.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    chunks.push(ALIGN_RIGHT);
    chunks.push(BOLD_ON);
    chunks.push(line(`TOPLAM: ${total} TL`));
    chunks.push(BOLD_OFF);
    chunks.push(ALIGN_CENTER);
    chunks.push(LINE_FEED);
    chunks.push(LINE_FEED);
    chunks.push(LINE_FEED);
    chunks.push(CUT);

    return Buffer.concat(chunks);
}

function getPortionText(qty) {
    const map = {
        0.5: 'YARIM',
        1:   'TAM',
        1.5: 'BIR BUCUK',
        2:   'CIFT',
    };
    return map[qty] ? `${map[qty]} PORSIYON` : `${qty} PORSIYON`;
}

// ─── Backend API çağrıları ────────────────────────────────────────────────────
async function fetchUnprinted() {
    const res = await fetch(`${API_URL}/api/orders/unprinted`, { timeout: 10000 });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
}

async function markPrinted(orderId) {
    const res = await fetch(`${API_URL}/api/orders/${orderId}/mark-printed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
    });
    if (!res.ok) throw new Error(`mark-printed ${res.status}`);
}

async function keepAlive() {
    try {
        await fetch(`${API_URL}/api/ping`, { timeout: 8000 });
        console.log(`⏰ ${new Date().toLocaleTimeString('tr-TR')} — Keep-alive gönderildi`);
    } catch (e) {
        console.warn(`⚠️  Keep-alive başarısız: ${e.message}`);
    }
}

// ─── Retry ile yazdır ────────────────────────────────────────────────────────
async function printWithRetry(order, maxRetries = 5) {
    const receipt = buildReceipt(order);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sendToprinter(receipt);
            return true;
        } catch (err) {
            console.warn(`⚠️  Yazıcı denemesi ${attempt}/${maxRetries}: ${err.message}`);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1500 * attempt)); // artan bekleme
            }
        }
    }
    return false;
}

// ─── Ana Döngü ───────────────────────────────────────────────────────────────
async function poll() {
    try {
        const orders = await fetchUnprinted();
        if (orders.length > 0) {
            console.log(`📋 ${new Date().toLocaleTimeString('tr-TR')} — ${orders.length} yeni sipariş`);
        }

        for (const order of orders) {
            const hasPide = order.items.some(i => isPide(i.id));

            if (!hasPide) {
                // Sadece içecek → fiş basma, sadece kaydet
                await markPrinted(order._id);
                console.log(`🥤 Masa ${order.tableNumber} — Sadece içecek, fiş basılmadı`);
                continue;
            }

            // Pide var → fiş bas
            const success = await printWithRetry(order);
            if (success) {
                await markPrinted(order._id);
                console.log(`✅ Masa ${order.tableNumber} — Fiş basıldı (#${order.orderNumber})`);
            } else {
                console.error(`❌ Masa ${order.tableNumber} — Fiş BASILA MADI, sonraki turda tekrar denenecek`);
            }
        }
    } catch (err) {
        console.warn(`⚠️  ${new Date().toLocaleTimeString('tr-TR')} — Bağlantı hatası: ${err.message}`);
    }
}

// ─── Başlat ──────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════╗');
console.log('║  PIDE OTAGI — PRINT AGENT v2.0      ║');
console.log('╚══════════════════════════════════════╝');
console.log(`📡 API   : ${API_URL}`);
console.log(`🖨️  Yazici: ${PRINTER_IP}:${PRINTER_PORT} (TCP/Ethernet)`);
console.log(`⏱️  Kontrol: her ${POLL_INTERVAL / 1000} saniye`);
console.log('');
console.log('✅ Servis bassladi. Ctrl+C ile durdurun.');
console.log('');

// İlk çalıştırma
poll();
setInterval(poll, POLL_INTERVAL);

// Keep-alive: 10 dakikada bir Render'ı uyandır
keepAlive();
setInterval(keepAlive, PING_INTERVAL);
