@echo off
echo ======================================================================
echo   IEM ADMISSION PORTAL — FIREBASE DEPLOYMENT SCRIPT
echo   Target Project: iem-admission-404bn
echo ======================================================================
echo.

echo [1/3] Building Angular Production Frontend...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed.
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/3] Checking Firebase CLI & Target Project...
call npx firebase-tools use iem-admission-404bn

echo.
echo [3/3] Deploying to Firebase Hosting, Firestore, and Storage...
call npx firebase-tools deploy --only hosting,firestore,storage
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed.
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================================
echo   DEPLOYMENT SUCCESSFUL!
echo   Live URL: https://iem-admission-404bn.web.app
echo   Console:  https://console.firebase.google.com/project/iem-admission-404bn/overview
echo ======================================================================
pause
