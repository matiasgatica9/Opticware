@echo off
echo ============================================
echo   OpticWare - Git init + Push a GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] Limpiando .git anterior (si existe)...
if exist ".git" rmdir /s /q .git

echo [2/6] Inicializando repositorio Git...
git init -b main
if errorlevel 1 (
    echo ERROR: Git no esta instalado.
    pause
    exit /b 1
)

echo [3/6] Configurando usuario...
git config user.email "matias97gatica@gmail.com"
git config user.name "Matias"

echo [4/6] Agregando todos los archivos...
git add .

echo [5/6] Creando commit inicial...
git commit -m "feat: OpticWare v1 - sistema de gestion para opticas"

echo [6/6] Conectando con GitHub y subiendo...
git remote add origin https://github.com/matiasgatica9/Opticware.git
git branch -M main
git push -u origin main

echo.
echo ============================================
echo   LISTO! Codigo subido a GitHub.
echo ============================================
echo.
echo Ahora ve a https://vercel.com
echo   1. New Project
echo   2. Importar: matiasgatica9/Opticware
echo   3. Agregar variables de entorno (te las mando por chat)
echo   4. Deploy
echo.
pause
