/**
 * Pide Otağı — Print Agent
 * 
 * Bu servis kasadaki bilgisayarda arka planda çalışır.
 * Her 3 saniyede backend'e sorar: "Yeni basılmamış sipariş var mı?"
 * Varsa → XPRINTER XP-Q80A'ya mutfak fişini basar.
 * 
 * Kurulum:
 *   1. npm install
 *   2. .env.example'ı .env olarak kopyala, API_URL'i doldur
 *   3. node agent.js
 */

require('dotenv').config();
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const fetch = require('node-fetch');

// ─── Ayarlar ────────────────────────────────────────────────────────────────
const API_URL       = process.env.API_URL || 'https://pide-otagi-backend.onrender.com';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 3000;  // ms
const PRINTER_TYPE  = process.env.PRINTER_TYPE || 'usb';             // 'usb' | 'tcp'
const PRINTER_IP    = process.env.PRINTER_IP   || '192.168.1.200';
const PRINTER_PORT  = parseInt(process.env.PRINTER_PORT) || 9100;

// ─── Yazıcıyı başlat ────────────────────────────────────────────────────────
function createPrinter() {
    const config = {
        type: PrinterTypes.EPSON,  // XPRINTER ESC/POS uyumlu
        characterSet: CharacterSet.PC857_TURKISH,  // Türkçe karakter desteği
        removeSpecialCharacters: false,
        lineCharacter: '-',
        breakLine: BreakLine.WORD,
    };

    if (PRINTER_TYPE === 'tcp') {
        config.interface = `tcp://${PRINTER_IP}:${PRINTER_PORT}`;
        console.log(`🖨️  Yazıcı tipi: TCP (${PRINTER_IP}:${PRINTER_PORT})`);
    } else {
        // USB — Windows'ta otomatik bulunur
        config.interface = process.env.PRINTER_USB_PATH || 'printer:XPRINTER XP-Q80A';
        console.log(`🖨️  Yazıcı tipi: USB`);
    }

    return new ThermalPrinter(config);
}

// ─── Fiş formatı ────────────────────────────────────────────────────────────
function buildReceiptCommands(order) {
    const printer = createPrinter();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('tr-TR');
    const orderNum = String(order.orderNumber || '?').padStart(3, '0');

    // ── Başlık ──
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('PİDE OTAĞI');
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.drawLine();

    // ── Masa & Sıra ──
    printer.alignLeft();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`MASA: ${order.tableNumber}`);
    printer.setTextSize(0, 0);
    printer.bold(false);
    printer.println(`Sıra: #${orderNum}    Saat: ${timeStr}`);
    printer.println(`Tarih: ${dateStr}`);
    printer.drawLine();

    // ── Ürünler — Pideler ──
    const pideItems = order.items.filter(item => item.id <= 7);
    const drinkItems = order.items.filter(item => item.id > 7);

    if (pideItems.length > 0) {
        printer.bold(true);
        printer.println('** PİDELER (FIRINDA) **');
        printer.bold(false);
        printer.newLine();

        pideItems.forEach(item => {
            const portionLabel = getPortionLabel(item.quantity);
            const portionNote  = getPortionNote(item.quantity);

            printer.bold(true);
            printer.println(`${item.quantity}x  ${item.name}`);
            printer.bold(false);
            printer.println(`    >>> ${portionLabel} <<<`);
            if (portionNote) {
                printer.println(`    NOT: ${portionNote}`);
            }
            printer.newLine();
        });
    }

    if (drinkItems.length > 0) {
        printer.drawLine();
        printer.bold(true);
        printer.println('-- İÇECEK (GARSON VERIR) --');
        printer.bold(false);
        drinkItems.forEach(item => {
            printer.println(`  ${item.quantity}x  ${item.name}`);
        });
        printer.newLine();
    }

    // ── Toplam ──
    printer.drawLine();
    const total = order.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    printer.alignRight();
    printer.bold(true);
    printer.println(`TOPLAM: ${total} TL`);
    printer.bold(false);
    printer.alignCenter();
    printer.println('* * *');
    printer.newLine();
    printer.newLine();
    printer.newLine();
    printer.cut();

    return printer;
}

// ─── Porsiyon etiketleri ────────────────────────────────────────────────────
function getPortionLabel(qty) {
    const map = {
        0.5: 'YARIM PORSİYON',
        1:   'TAM PORSİYON',
        1.5: 'BİR BUÇUK PORSİYON',
        2:   'ÇİFT PORSİYON',
    };
    return map[qty] || `${qty} PORSİYON`;
}

function getPortionNote(qty) {
    const notes = {
        0.5: 'Ortadan kes — tek yüz pişir',
        1.5: 'Tam + yarım aynı pideden kes',
    };
    return notes[qty] || '';
}

// ─── Fişi bas ───────────────────────────────────────────────────────────────
async function printOrder(order) {
    const printer = buildReceiptCommands(order);

    try {
        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            throw new Error('Yazıcıya ulaşılamıyor! USB bağlantısını kontrol edin.');
        }

        await printer.execute();
        console.log(`✅ Fiş basıldı → Masa ${order.tableNumber} / Sipariş #${order.orderNumber}`);
        return true;
    } catch (err) {
        console.error(`❌ Yazıcı hatası:`, err.message);
        return false;
    }
}

// ─── Backend'den basılmamış siparişleri çek ─────────────────────────────────
async function fetchUnprintedOrders() {
    const resp = await fetch(`${API_URL}/api/orders/unprinted`);
    if (!resp.ok) throw new Error(`API hatası: ${resp.status}`);
    return resp.json();
}

// ─── Siparişi basıldı olarak işaretle ───────────────────────────────────────
async function markPrinted(orderId) {
    const resp = await fetch(`${API_URL}/api/orders/${orderId}/mark-printed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!resp.ok) throw new Error(`mark-printed hatası: ${resp.status}`);
    return resp.json();
}

// ─── Ana döngü (polling) ────────────────────────────────────────────────────
async function poll() {
    try {
        const orders = await fetchUnprintedOrders();

        if (orders.length > 0) {
            console.log(`📋 ${orders.length} yeni sipariş bulundu.`);
        }

        for (const order of orders) {
            const success = await printOrder(order);

            if (success) {
                // Başarıyla basıldıysa backend'i güncelle
                await markPrinted(order._id);
            } else {
                console.warn(`⚠️  Sipariş ${order._id} basılamadı, bir sonraki turda tekrar denenecek.`);
            }
        }
    } catch (err) {
        // API'ye ulaşılamıyor (internet yok, backend uyuyor vs.)
        console.warn(`⚠️  Bağlantı hatası: ${err.message}`);
    }
}

// ─── Başlat ─────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════╗');
console.log('║   PİDE OTAĞI — PRİNT AGENT v1.0     ║');
console.log('╚══════════════════════════════════════╝');
console.log(`📡 API: ${API_URL}`);
console.log(`⏱️  Kontrol aralığı: ${POLL_INTERVAL / 1000} saniye`);
console.log(`🖨️  Yazıcı modu: ${PRINTER_TYPE.toUpperCase()}`);
console.log('');
console.log('✅ Servis başladı. Ctrl+C ile durdurun.');
console.log('');

// İlk çalışma
poll();

// Periyodik polling
setInterval(poll, POLL_INTERVAL);
