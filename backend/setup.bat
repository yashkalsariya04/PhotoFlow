@echo off
REM PhotoFlow Backend - Quick Start Script (Windows)

echo ================================================
echo   PhotoFlow Backend - Quick Start
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

echo [OK] Node.js version:
node -v
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed. Please install Docker
    exit /b 1
)

echo [OK] Docker version:
docker -v
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [WARNING] Please update .env with your configuration
    echo.
)

REM Create uploads directory
if not exist uploads (
    echo Creating uploads directory...
    mkdir uploads
    echo.
)

REM Start MongoDB
echo Starting MongoDB with Docker...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start MongoDB
    exit /b 1
)
echo.

REM Wait for MongoDB to be ready
echo Waiting for MongoDB to be ready...
timeout /t 5 /nobreak >nul
echo.

echo ================================================
echo   Setup complete!
echo ================================================
echo.
echo To start the development server, run:
echo   npm run start:dev
echo.
echo The server will be available at:
echo   https://PhotoFlow.sonomainfotech.in/api
echo.
echo To stop MongoDB:
echo   docker-compose down
echo ================================================
