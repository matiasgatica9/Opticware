@echo off
echo Deteniendo el servidor anterior...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

cd /d "C:\Users\matia\OneDrive\Escritorio\OneDrive\Proyecto juego\opticware"

echo Iniciando dev server con auth real...
start cmd /k "npm run dev"

echo.
echo Servidor reiniciado!
echo Abriendo http://localhost:3000/login ...
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000/login"
exit
