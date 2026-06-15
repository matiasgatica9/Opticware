@echo off
echo ============================================
echo  OpticWare - Commit y Push a GitHub
echo ============================================
echo.
cd /d "C:\Users\matia\OneDrive\Escritorio\OneDrive\Proyecto juego\opticware"

echo [1/5] Eliminando locks de git...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
echo       OK

echo [2/5] Agregando archivos...
git add -A
if errorlevel 1 ( echo ERROR en git add && pause && exit /b 1 )

echo [3/5] Haciendo commit...
git commit -m "fix: factura server component + print nueva ventana + WhatsApp modal; seguridad middleware rate-limit Zod RLS headers; color texto WhatsApp"
if errorlevel 1 ( echo No hay cambios nuevos para commitear, continuando... )

echo [4/5] Sincronizando con GitHub (pull --rebase)...
git pull --rebase origin main
if errorlevel 1 ( echo ERROR en git pull && pause && exit /b 1 )

echo [5/5] Pusheando a GitHub...
git push origin main
if errorlevel 1 ( echo ERROR en push - verificar credenciales && pause && exit /b 1 )

echo.
echo ============================================
echo  LISTO! Deploy en Vercel en ~2 minutos
echo  https://opticware.vercel.app
echo ============================================
pause
