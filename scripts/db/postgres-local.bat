@echo off
REM Script para gestionar PostgreSQL local en Windows
REM Uso: scripts\db\postgres-local.bat [start|stop|status|install]

setlocal

set "POSTGRES_SERVICE=postgresql-x64-15"
set "POSTGRES_USER=postgres"
set "DB_NAME=fullstack_template"

if "%1"=="install" goto install
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="status" goto status
if "%1"=="create-db" goto create_db
if "%1"=="help" goto help

:help
echo.
echo 🔧 Local PostgreSQL Manager for Next.js Fullstack Starter
echo.
echo Usage: %~nx0 [command]
echo.
echo Available commands:
echo   install    - Install PostgreSQL using Chocolatey
echo   start      - Start PostgreSQL service
echo   stop       - Stop PostgreSQL service
echo   status     - Check service status
echo   create-db  - Create project database
echo   help       - Show this help
echo.
goto end

:install
echo 🔽 Installing PostgreSQL with Chocolatey...
echo.
where choco >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Chocolatey is not installed. Installing first...
    echo.
    echo Run this command as Administrator:
    echo Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo.
    echo Then run: choco install postgresql --params '/Password:postgres'
    goto end
)

echo Installing PostgreSQL...
choco install postgresql --params "/Password:postgres" -y

if %errorlevel% equ 0 (
    echo ✅ PostgreSQL installed successfully
    echo 🔄 Starting service...
    call :start
    call :create_db
) else (
    echo ❌ Installation error
)
goto end

:start
echo 🚀 Starting PostgreSQL...
net start %POSTGRES_SERVICE% 2>nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL started successfully
) else (
    echo ℹ️  PostgreSQL was already running or start error
)
goto end

:stop
echo 🛑 Stopping PostgreSQL...
net stop %POSTGRES_SERVICE% 2>nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL stopped successfully
) else (
    echo ℹ️  PostgreSQL was already stopped or stop error
)
goto end

:status
echo 📊 PostgreSQL Status:
echo.
sc query %POSTGRES_SERVICE% | findstr "STATE"
if %errorlevel% equ 0 (
    echo.
    echo 🔍 PostgreSQL Processes:
    tasklist | findstr postgres
) else (
    echo ❌ PostgreSQL service not found
)
goto end

:create_db
echo 🏗️  Creating project database...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ psql is not in PATH. Adding typical path...
    set "PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin"
)

echo Connecting as postgres user...
psql -U %POSTGRES_USER% -c "SELECT 1;" postgres >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Cannot connect to PostgreSQL.
    echo    Check that service is running and password is correct.
    echo    Default password: postgres
    goto end
)

echo Creating database '%DB_NAME%'...
psql -U %POSTGRES_USER% -c "CREATE DATABASE %DB_NAME%;" postgres 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database '%DB_NAME%' created successfully
) else (
    echo ℹ️  Database '%DB_NAME%' already exists or creation error
)

echo.
echo 📋 Configuration for .env.local:
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/%DB_NAME%?schema=public"
echo.
goto end

:end
endlocal