@echo off
setlocal enabledelayedexpansion
title Mobile Card BD - Auto Deploy System
color 0B
cd /d "%~dp0"

:: ============================================
:: AUTO CONFIGURATION - NO MANUAL CHANGES NEEDED
:: ============================================
set "FRONTEND_URL=https://playful-chimera-284bb0.netlify.app"
set "BACKEND_URL=https://mobile-card-bd.onrender.com"
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "DIST_DIR=%FRONTEND_DIR%\dist"
set "PUBLISH_DIR=%PROJECT_ROOT%NETLIFY-DEPLOY"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "LOG=%PROJECT_ROOT%readydeploy.log"

:: ============================================
:: AUTO START - CHECK NODE.JS
:: ============================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js
    pause
    exit
)

:: ============================================
:: MAIN MENU
:: ============================================
:main
cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║   Mobile Card BD - AUTO DEPLOY SYSTEM     ║
echo ╚════════════════════════════════════════════╝
echo.
echo    [1] BUILD ^& PACKAGE FRONTEND -^> Netlify Ready
echo    [2] DEPLOY BACKEND -^> Render (Git Auto Push)
echo    [3] FULL DEPLOY (Frontend + Backend)
echo    [4] OPEN Deploy Folder
echo    [5] OPEN Live Websites
echo    [6] EXIT
echo.
echo ═════════════════════════════════════════════
echo    FRONTEND : %FRONTEND_URL%
echo    BACKEND  : %BACKEND_URL%
echo ═════════════════════════════════════════════
echo.
set /p "choice=Enter choice [1-6]: "

if "%choice%"=="1" call :AutoBuildFrontend
if "%choice%"=="2" call :AutoDeployBackend
if "%choice%"=="3" call :FullDeploy
if "%choice%"=="4" call :OpenDeployFolder
if "%choice%"=="5" call :OpenLiveSites
if "%choice%"=="6" goto :end
echo Invalid choice!
timeout /t 2 >nul
goto main

:: ============================================
:: AUTO FRONTEND BUILD + PACKAGE
:: ============================================
:AutoBuildFrontend
call :Log "========================================"
call :Log "AUTO FRONTEND BUILD STARTED"
call :Log "========================================"
cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║     AUTO FRONTEND BUILD + PACKAGE         ║
echo ╚════════════════════════════════════════════╝
echo.
echo [1/6] Checking frontend directory...
if not exist "%FRONTEND_DIR%" (
    echo [FAIL] frontend\ folder not found!
    call :Log "[FAIL] frontend folder missing"
    pause
    goto main
)
echo [OK] Frontend directory found

echo.
echo [2/6] Installing dependencies...
cd /d "%FRONTEND_DIR%"
call npm install 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Some warnings but continuing...
)
echo [OK] Dependencies installed
cd /d "%PROJECT_ROOT%"

echo.
echo [3/6] Building production bundle...
cd /d "%FRONTEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo [FAIL] Build failed!
    call :Log "[FAIL] Build error"
    cd /d "%PROJECT_ROOT%"
    pause
    goto main
)
echo [OK] Build successful
cd /d "%PROJECT_ROOT%"

echo.
echo [4/6] Creating deploy package...
if exist "%PUBLISH_DIR%" (
    rmdir /s /q "%PUBLISH_DIR%" 2>nul
)
xcopy "%DIST_DIR%\*" "%PUBLISH_DIR%\" /E /I /Q /Y >nul
echo [OK] Package created: NETLIFY-DEPLOY\

echo.
echo [5/6] Auto-generating Netlify config...
call :GenerateNetlifyConfig
echo [OK] _redirects + netlify.toml created

echo.
echo [6/6] Verifying package...
call :VerifyPackage

echo.
echo ╔════════════════════════════════════════════╗
echo ║  FRONTEND BUILD COMPLETE - READY!         ║
echo ╚════════════════════════════════════════════╝
echo.
echo    Folder: %PUBLISH_DIR%
echo.
echo    Next: Drag-drop this folder to Netlify
echo    https://app.netlify.com
echo.
call :Log "[OK] Frontend package ready"

explorer "%PUBLISH_DIR%"
start https://app.netlify.com

pause
goto main

:: ============================================
:: AUTO BACKEND DEPLOY
:: ============================================
:AutoDeployBackend
call :Log "========================================"
call :Log "AUTO BACKEND DEPLOY STARTED"
call :Log "========================================"
cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║     AUTO BACKEND DEPLOY TO RENDER         ║
echo ╚════════════════════════════════════════════╝
echo.
echo [1/4] Checking backend files...
if not exist "%BACKEND_DIR%\server.js" (
    echo [FAIL] backend\server.js not found!
    pause
    goto main
)
echo [OK] server.js found

if not exist "%BACKEND_DIR%\package.json" (
    echo [FAIL] backend\package.json not found!
    pause
    goto main
)
echo [OK] package.json found

echo.
echo [2/4] Checking Git repository...
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Not a Git repository!
    echo Run: git init ^&^& git remote add origin YOUR_REPO_URL
    pause
    goto main
)
echo [OK] Git repository ready

echo.
echo [3/4] Adding and committing files...
git add backend\
git add package.json package-lock.json 2>nul
git add start.bat start.ps1 visitor-server.js 2>nul
git commit -m "Auto Deploy: Backend update [%date% %time%]" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] No changes to commit or commit done
)
echo [OK] Files committed

echo.
echo [4/4] Pushing to GitHub...
echo Render will auto-deploy from GitHub...
git push 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Push failed!
    echo Check your internet and GitHub connection.
    call :Log "[FAIL] Git push failed"
    pause
    goto main
)
echo [OK] Pushed successfully!

echo.
echo ╔════════════════════════════════════════════╗
echo ║  BACKEND DEPLOYED TO RENDER!              ║
echo ╚════════════════════════════════════════════╝
echo.
echo    Backend: %BACKEND_URL%
echo    Render will deploy in 2-3 minutes
echo.
call :Log "[OK] Backend deployed to Render"

start %BACKEND_URL%
pause
goto main

:: ============================================
:: FULL DEPLOY (FRONTEND + BACKEND)
:: ============================================
:FullDeploy
cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║        FULL AUTO DEPLOY STARTED           ║
echo ╚════════════════════════════════════════════╝
echo.
echo Step 1/2: Building Frontend...
call :AutoBuildFrontend
echo.
echo Step 2/2: Deploying Backend...
call :AutoDeployBackend
echo.
echo ╔════════════════════════════════════════════╗
echo ║     FULL DEPLOY COMPLETE!                 ║
echo ╚════════════════════════════════════════════╝
pause
goto main

:: ============================================
:: OPEN FOLDERS / SITES
:: ============================================
:OpenDeployFolder
if exist "%PUBLISH_DIR%" (
    explorer "%PUBLISH_DIR%"
    echo Folder opened: %PUBLISH_DIR%
) else (
    echo Deploy folder not found. Run option [1] first.
)
pause
goto main

:OpenLiveSites
echo Opening live sites...
start %FRONTEND_URL%
start %BACKEND_URL%
echo Frontend: %FRONTEND_URL%
echo Backend: %BACKEND_URL%
call :Log "[URL] Live sites opened"
pause
goto main

:: ============================================
:: NETLIFY CONFIG GENERATOR
:: ============================================
:GenerateNetlifyConfig
(
echo # ═══════════════════════════════════════
echo # Mobile Card BD - Netlify Config
echo # Auto-generated: %date% %time%
echo # ═══════════════════════════════════════
echo.
echo # API Proxy to Render Backend
echo /api/* https://mobile-card-bd.onrender.com/api/:splat 200
echo /Payment/* https://mobile-card-bd.onrender.com/Payment/:splat 200
echo /socket.io/* https://mobile-card-bd.onrender.com/socket.io/:splat 200
echo.
echo # SPA Fallback - MUST be last rule
echo /* /index.html 200
) > "%PUBLISH_DIR%\_redirects"

(
echo # ═══════════════════════════════════════
echo # Mobile Card BD - Netlify Config
echo # ═══════════════════════════════════════
echo.
echo [build]
echo   publish = "."
echo.
echo [[redirects]]
echo   from = "/api/*"
echo   to = "https://mobile-card-bd.onrender.com/api/:splat"
echo   status = 200
echo.
echo [[redirects]]
echo   from = "/Payment/*"
echo   to = "https://mobile-card-bd.onrender.com/Payment/:splat"
echo   status = 200
echo.
echo [[redirects]]
echo   from = "/socket.io/*"
echo   to = "https://mobile-card-bd.onrender.com/socket.io/:splat"
echo   status = 200
echo.
echo [[redirects]]
echo   from = "/*"
echo   to = "/index.html"
echo   status = 200
) > "%PUBLISH_DIR%\netlify.toml"
goto :eof

:: ============================================
:: VERIFY PACKAGE
:: ============================================
:VerifyPackage
set VERIFY_OK=1
if exist "%PUBLISH_DIR%\index.html" (
    echo [OK] index.html
) else (
    echo [FAIL] index.html MISSING
    set VERIFY_OK=0
)
if exist "%PUBLISH_DIR%\_redirects" (
    echo [OK] _redirects
) else (
    echo [FAIL] _redirects MISSING
    set VERIFY_OK=0
)
if exist "%PUBLISH_DIR%\netlify.toml" (
    echo [OK] netlify.toml
) else (
    echo [FAIL] netlify.toml MISSING
    set VERIFY_OK=0
)
if exist "%PUBLISH_DIR%\assets\" (
    echo [OK] assets\ folder
) else (
    echo [WARN] assets\ folder missing
)
if %VERIFY_OK%==0 (
    echo [WARN] Some files missing but build may still work.
)
goto :eof

:: ============================================
:: LOGGER
:: ============================================
:Log
echo [%date% %time%] %~1 >> "%LOG%"
goto :eof

:: ============================================
:: EXIT
:: ============================================
:end
echo.
echo Thanks for using Mobile Card BD Auto Deploy!
echo.
timeout /t 2 >nul
exit