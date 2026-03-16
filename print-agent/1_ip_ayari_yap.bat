@echo off
:: PİDE OTAĞI - YAZICI İÇİN ETHERNET IP AYARI
:: Bu script, bilgisayarın yazıcıyla konuşabilmesi için sabit IP atar.
:: Yönetici yetkisiyle çalıştırılmalıdır!
title Pide Otagi - Ag Yapilandirma
color 0B
echo.
echo ========================================================
echo PIDE OTAGI - YAZICI ICIN ETHERNET AYARI
echo ========================================================
echo.

:: Yönetici kontrolü
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Bu araci calistirmak icin YONETICI YETKISI gerekiyor.
    echo Lutfen bu dosyaya sag tiklayip "Yonetici olarak calistir" deyin.
    echo.
    pause
    exit /b
)

:: Ağ bağdaştırıcılarını listele
echo Mevcut Ag Baglantilari:
netsh interface show interface
echo.
echo Lutfen ETHERNET baglantinizin adini yazin.
echo Ornek: "Ethernet" veya "Yerel Ag Baglantisi"
set /p adapterName="Baglanti Adi: "

echo.
echo [%adapterName%] icin 192.168.123.5 IP'si ayarlaniyor...
netsh interface ip set address name="%adapterName%" static 192.168.123.5 255.255.255.0 192.168.123.1

if %errorLevel% equ 0 (
    echo.
    echo [BASARILI] IP adresi ayarlandi! Bilgisayariniz artik yaziciyi gorebilir.
) else (
    echo.
    echo [HATA] IP adresi ayarlanamadi. Girdiginiz baglanti adini kontrol edin.
)

echo.
pause
