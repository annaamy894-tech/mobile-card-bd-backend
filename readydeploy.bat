@echo off
setlocal enabledelayedexpansion
title Mobile Card BD - Ready Deploy
color 0B
cd /d "%~dp0"

set "FRONTEND_URL=https://mobile-card-bd.vercel.app"
set "BACKEND_URL=https://mobile-card-bd.onrender.com"
set "LOG=readydeploy.log"

:main
cls
echo.
echo ============================================
echo    Mobile Card BD - Ready Deploy System
echo ============================================
echo.
echo    [1] Deploy FRONTEND to Vercel
echo    [2] Deploy BACKEND to Render
echo    [3] Open Live Website
echo    [4] Exit
echo.
echo ============================================
echo    FRONTEND : %FRONTEND_URL%
echo    BACKEND  : %BACKEND_URL%
echo ============================================
echo.
set /p "choice=Enter your choice (1-4): "

if "%choice%"=="1" call :deployFrontend
if "%choice%"=="2" call :deployBackend
if "%choice%"=="3" call :openSites
if "%choice%"=="4" goto end
echo Invalid choice!
pause
goto main

:deployFrontend
call :log "========================================"
call :log " FRONTEND DEPLOY STARTED"
call :log "========================================"
cls
echo.
echo ============================================
echo    Deploying FRONTEND to Vercel...
echo ============================================
echo.
echo [1/5] Checking frontend folder... [0%%]
if not exist "frontend\package.json" (
    echo [FAIL] frontend\package.json not found!
    call :log "[FAIL] frontend missing"
    pause
    goto main
)
echo [OK] Frontend folder found [5%%]

echo.
echo [2/5] Installing dependencies... [5%%]
cd frontend
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    echo [FAIL] npm install failed!
    call :log "[FAIL] npm install"
    cd ..
    pause
    goto main
)
echo [OK] Dependencies ready [25%%]
cd ..

echo.
echo [3/5] Building production bundle... [25%%]
cd frontend
echo Running: vite build
call npm run build
if %errorlevel% neq 0 (
    echo [FAIL] Build failed! See errors above.
    call :log "[FAIL] Build"
    cd ..
    pause
    goto main
)
echo [OK] Build successful [60%%]
cd ..

echo.
echo [4/5] Committing to Git... [60%%]
git add .
git commit -m "Deploy frontend [%date% %time%]" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] No new changes to commit [60%%]
) else (
    echo [OK] Changes committed [75%%]
)

echo.
echo [5/5] Pushing to GitHub... [75%%]
echo Vercel will auto-deploy on push...
git push 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Push failed! Checking internet...
    ping -n 1 github.com >nul 2>&1
    if %errorlevel% neq 0 (
        echo [FAIL] No internet connection!
        call :log "[FAIL] No internet"
    ) else (
        echo [FAIL] Git push error
        call :log "[FAIL] Git error"
    )
    pause
    goto main
)
echo [OK] Pushed to GitHub [100%%]
call :log "[OK] Frontend deployed"

echo.
echo ============================================
echo    FRONTEND DEPLOYED SUCCESSFULLY! [100%%]
echo ============================================
echo    Live: %FRONTEND_URL%
echo    Vercel is building... (30-60 sec)
echo ============================================
start %FRONTEND_URL%
pause
goto main

:deployBackend
call :log "========================================"
call :log " BACKEND DEPLOY STARTED"
call :log "========================================"
cls
echo.
echo ============================================
echo    Deploying BACKEND to Render...
echo ============================================
echo.
echo [1/4] Checking backend files... [0%%]
if not exist "backend\server.js" (
    echo [FAIL] backend\server.js not found!
    call :log "[FAIL] server.js missing"
    pause
    goto main
)
echo [OK] Backend files verified [10%%]

echo.
echo [2/4] Checking for changes... [10%%]
git status backend\ --short 2>&1 | findstr "." >nul
if %errorlevel% neq 0 (
    echo [INFO] No changes in backend [10%%]
    echo [SKIP] Nothing to deploy
    pause
    goto main
)
echo [OK] Changes detected [25%%]

echo.
echo [3/4] Committing changes... [25%%]
git add backend\
git commit -m "Deploy backend [%date% %time%]" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Commit skipped [25%%]
) else (
    echo [OK] Changes committed [50%%]
)

echo.
echo [4/4] Pushing to GitHub... [50%%]
echo Render will auto-deploy on push...
git push 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Push failed!
    call :log "[FAIL] Push"
    pause
    goto main
)
echo [OK] Pushed to GitHub [100%%]
call :log "[OK] Backend deployed"

echo.
echo ============================================
echo    BACKEND DEPLOYED SUCCESSFULLY! [100%%]
echo ============================================
echo    Live: %BACKEND_URL%
echo    Render is deploying... (2-3 min)
echo ============================================
start %BACKEND_URL%
pause
goto main

:openSites
echo Opening live sites...
start %FRONTEND_URL%
start %BACKEND_URL%
call :log "[URL] Both sites opened"
goto main

:log
echo [%date% %time%] %~1 >> %LOG%
goto :eof

:end
echo Goodbye!
exit