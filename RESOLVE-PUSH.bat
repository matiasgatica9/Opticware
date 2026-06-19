@echo off
echo ============================================
echo  OpticWare - Push limpio (sin editor vim)
echo ============================================
echo.
cd /d "C:\Users\matia\OneDrive\Escritorio\OneDrive\Proyecto juego\opticware"

echo [1/5] Eliminando locks y swap files...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\.COMMIT_EDITMSG.swp" 2>nul
del /f /q ".git\COMMIT_EDITMSG.swp" 2>nul
echo       OK

echo [2/5] Abortando rebase en curso...
git -c core.editor=true rebase --abort 2>nul
echo       OK

echo [3/5] Agregando todos los archivos...
git add -A
if errorlevel 1 ( echo ERROR en git add && pause && exit /b 1 )

echo [4/5] Commiteando sin abrir editor...
git -c core.editor=true commit -m "feat: whatsapp via wa.me — sin API, lab pagos, dashboard real, sidebar sin badges"
if errorlevel 1 ( echo No hay cambios nuevos, continuando... )

echo [5/5] Pusheando a GitHub...
git push origin main --force-with-lease
if errorlevel 1 (
  git push origin main
  if errorlevel 1 ( echo ERROR en push && pause && exit /b 1 )
)

echo.
echo ============================================
echo  LISTO! Deploy en Vercel en ~2 minutos
echo  https://opticware.vercel.app
echo ============================================
pause
