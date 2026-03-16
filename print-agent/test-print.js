/**
 * Pide Otağı — Yazıcı Test Scripti
 *
 * Yazıcıya test fişi basar.
 * Kullanım: node test-print.js
 */

require('dotenv').config();
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');

const PRINTER_TYPE = process.env.PRINTER_TYPE || 'usb';
const PRINTER_IP   = process.env.PRINTER_IP   || '192.168.1.200';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT) || 9100;

async function testPrint() {
    console.log('🧪 Test fişi basılıyor...\n');

    const config = {
        type: PrinterTypes.EPSON,
        characterSet: CharacterSet.PC857_TURKISH,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        breakLine: BreakLine.WORD,
    };

    if (PRINTER_TYPE === 'tcp') {
        config.interface = `tcp://${PRINTER_IP}:${PRINTER_PORT}`;
        console.log(`→ TCP modu: ${PRINTER_IP}:${PRINTER_PORT}`);
    } else {
        config.interface = process.env.PRINTER_USB_PATH || 'printer:XPRINTER XP-Q80A';
        console.log(`→ USB modu`);
    }

    const printer = new ThermalPrinter(config);

    try {
        const connected = await printer.isPrinterConnected();
        if (!connected) {
            console.error('❌ Yazıcıya bağlanılamadı!');
            console.log('');
            console.log('Kontrol listesi:');
            console.log('  1. USB kablosu takılı mı?');
            console.log('  2. Yazıcı açık mı?');
            console.log('  3. Windows Aygıt Yöneticisinde görünüyor mu?');
            console.log('  4. .env dosyasındaki PRINTER_TYPE doğru mu?');
            process.exit(1);
        }

        printer.alignCenter();
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println('PİDE OTAĞI');
        printer.setTextSize(0, 0);
        printer.bold(false);
        printer.drawLine();
        printer.alignLeft();
        printer.println('TEST FİŞİ');
        printer.println('Türkçe karakterler: ğüşıöçĞÜŞİÖÇ');
        printer.drawLine();
        printer.bold(true);
        printer.println('1x  Kıymalı Pide');
        printer.bold(false);
        printer.println('    >>> TAM PORSİYON <<<');
        printer.newLine();
        printer.bold(true);
        printer.println('0.5x  Çökelekli Pide');
        printer.bold(false);
        printer.println('    >>> YARIM PORSİYON <<<');
        printer.println('    NOT: Ortadan kes — tek yüz pişir');
        printer.newLine();
        printer.drawLine();
        printer.alignCenter();
        printer.println('Yazıcı çalışıyor! ✓');
        printer.newLine();
        printer.newLine();
        printer.cut();

        await printer.execute();
        console.log('✅ Test fişi başarıyla basıldı!');
    } catch (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
}

testPrint();
