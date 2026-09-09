@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   LOKMA - Local Development Baslatiliyor
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Once https://nodejs.org uzerinden Node.js LTS kur.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Paketler ilk kez kuruluyor...
  call npm install
  if errorlevel 1 (
    echo npm install basarisiz oldu.
    pause
    exit /b 1
  )
)

echo.
echo Uygulama aciliyor: http://localhost:5173
start "" http://localhost:5173
call npm run dev
