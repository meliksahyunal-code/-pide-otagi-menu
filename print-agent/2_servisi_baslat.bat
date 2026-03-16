@echo off
:: PİDE OTAĞI - PRINT AGENT BAŞLATICISI
title Pide Otagi Print Agent
color 0A

echo ==========================================
echo PIDE OTAGI FIS YAZICI SERVISI BASLATILIYOR
echo ==========================================
echo.
echo Arka planda Node.js servisi aciliyor...
echo.

:: Bulunduğu dizine geç
cd /d "%~dp0"

:: Agent'ı çalıştır, hata alırsa pencereyi kapatma (pause)
node agent.js
if %errorLevel% neq 0 (
    echo.
    echo [HATA] Servis beklenmedik sekilde coktu!
    pause
)
