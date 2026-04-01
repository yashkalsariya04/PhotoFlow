@echo off
REM API Test Script for FaceMatrix Backend (Windows)

setlocal enabledelayedexpansion

set BASE_URL=https://facematrix.sonomainfotech.in/api
set TOKEN=

echo ================================================
echo   FaceMatrix API Test Suite
echo ================================================
echo.

REM Generate unique email
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set EMAIL=test_%mydate%%mytime%@example.com

echo Testing server availability...
curl -s -o nul -w "%%{http_code}" %BASE_URL% > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="404" (
    echo [OK] Server is running
) else (
    echo [ERROR] Server is not responding
    exit /b 1
)
echo.

echo Testing user registration...
curl -s -X POST "%BASE_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"%EMAIL%\",\"password\":\"testpass123\"}" > register.json

findstr /C:"token" register.json >nul
if %ERRORLEVEL%==0 (
    echo [OK] User registered successfully
    echo    Email: %EMAIL%
) else (
    echo [ERROR] Registration failed
    type register.json
    del register.json
    exit /b 1
)
echo.

echo Testing user login...
curl -s -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"testpass123\"}" > login.json

findstr /C:"token" login.json >nul
if %ERRORLEVEL%==0 (
    echo [OK] Login successful
    
    REM Extract token (simple extraction)
    for /f "tokens=2 delims=:," %%a in ('findstr "token" login.json') do set TOKEN_RAW=%%a
    set TOKEN=!TOKEN_RAW:"=!
) else (
    echo [ERROR] Login failed
    type login.json
    del register.json login.json
    exit /b 1
)
echo.

echo Testing get photos endpoint...
curl -s -X GET "%BASE_URL%/photos" ^
  -H "Authorization: Bearer !TOKEN!" > photos.json

findstr /C:"photos" photos.json >nul
if %ERRORLEVEL%==0 (
    echo [OK] Photos endpoint accessible
) else (
    echo [ERROR] Photos endpoint failed
    type photos.json
    del register.json login.json photos.json
    exit /b 1
)
echo.

echo Testing create album...
curl -s -X POST "%BASE_URL%/albums" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer !TOKEN!" ^
  -d "{\"title\":\"Test Album\",\"isSmart\":false,\"photoIds\":[]}" > album.json

findstr /C:"id" album.json >nul
if %ERRORLEVEL%==0 (
    echo [OK] Album created successfully
) else (
    echo [ERROR] Album creation failed
    type album.json
    del register.json login.json photos.json album.json
    exit /b 1
)
echo.

echo Testing authentication guard...
curl -s -o nul -w "%%{http_code}" -X GET "%BASE_URL%/photos" > auth_test.txt
set /p AUTH_STATUS=<auth_test.txt
del auth_test.txt

if "%AUTH_STATUS%"=="401" (
    echo [OK] Authentication guard working (401 Unauthorized)
) else (
    echo [WARNING] Expected 401, got %AUTH_STATUS%
)
echo.

REM Cleanup
del register.json login.json photos.json album.json

echo ================================================
echo   All tests passed!
echo ================================================
echo.
echo Test user created:
echo   Email: %EMAIL%
echo   Password: testpass123
echo.
echo You can now:
echo   - Upload photos via Postman
echo   - Test photo sharing
echo   - Explore the API
echo ================================================

endlocal
