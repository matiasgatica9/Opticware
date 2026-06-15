@echo off
cd /d "%~dp0"
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: dev bypass auth para demo sin login"
git push
echo.
echo Listo! Vercel va a redeploy en ~1 minuto.
pause
