@echo off
REM Script para gestionar Docker PostgreSQL
REM Uso: scripts\db\postgres-docker.bat [start|stop|restart|status|logs|shell]

setlocal

set "COMPOSE_FILE=docker-compose.yml"
set "POSTGRES_CONTAINER=fullstack_postgres"

if "%1"=="start" goto start
if "%1"=="stop" goto stop  
if "%1"=="restart" goto restart
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="shell" goto shell
if "%1"=="adminer" goto adminer
if "%1"=="pgadmin" goto pgadmin
if "%1"=="reset" goto reset
if "%1"=="help" goto help

:help
echo.
echo 🐳 Docker PostgreSQL Manager for Next.js Fullstack Starter
echo.
echo Usage: %~nx0 [command]
echo.
echo Available commands:
echo   start     - Start PostgreSQL containers
echo   stop      - Stop containers  
echo   restart   - Restart containers
echo   status    - Check containers status
echo   logs      - View PostgreSQL logs
echo   shell     - Access PostgreSQL shell
echo   adminer   - Open Adminer (web admin)
echo   pgadmin   - Open PgAdmin (advanced admin)
echo   reset     - Reset containers and volumes
echo   help      - Show this help
echo.
goto end

:start
echo 🚀 Starting PostgreSQL with Docker...
echo.

REM Check if Docker is available
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo    Install Docker Desktop from: https://docker.com/products/docker-desktop
    goto end
)

REM Check if Docker is running
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    echo    Start Docker Desktop and try again
    goto end
)

docker-compose -f %COMPOSE_FILE% up -d postgres

if %errorlevel% equ 0 (
    echo ✅ PostgreSQL started successfully
    echo.
    echo 🔗 Available connections:
    echo    Database: postgresql://postgres:postgres123@localhost:5432/fullstack_template
    echo    Adminer:  http://localhost:8080
    echo    PgAdmin:  http://localhost:5050 (admin@fullstack.local / admin123)
    echo.
    echo 📋 For .env.local:
    echo DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/fullstack_template?schema=public"
) else (
    echo ❌ Error starting PostgreSQL
)
goto end

:stop
echo 🛑 Stopping containers...
docker-compose -f %COMPOSE_FILE% stop
if %errorlevel% equ 0 (
    echo ✅ Containers stopped successfully
) else (
    echo ❌ Error stopping containers
)
goto end

:restart
echo 🔄 Restarting PostgreSQL...
docker-compose -f %COMPOSE_FILE% restart postgres
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL restarted successfully
) else (
    echo ❌ Error restarting PostgreSQL
)
goto end

:status
echo 📊 Estado de contenedores:
echo.
docker-compose -f %COMPOSE_FILE% ps
echo.
echo 🔍 Contenedores PostgreSQL:
docker ps --filter "name=%POSTGRES_CONTAINER%"
goto end

:logs
echo 📋 Logs de PostgreSQL:
echo.
docker-compose -f %COMPOSE_FILE% logs -f postgres
goto end

:shell
echo 🐚 Accediendo al shell de PostgreSQL...
echo    (Usa \q para salir)
echo.
docker exec -it %POSTGRES_CONTAINER% psql -U postgres -d fullstack_template
goto end

:adminer
echo 🌐 Abriendo Adminer...
start http://localhost:8080
goto end

:pgadmin
echo 🌐 Abriendo PgAdmin...
echo    Usuario: admin@fullstack.local
echo    Contraseña: admin123
start http://localhost:5050
goto end

:reset
echo ⚠️  ADVERTENCIA: Esto eliminará todos los datos de PostgreSQL
set /p confirm="¿Estás seguro? (y/N): "
if /i not "%confirm%"=="y" goto end

echo 🗑️  Eliminando contenedores y volúmenes...
docker-compose -f %COMPOSE_FILE% down -v --remove-orphans
docker system prune -f

if %errorlevel% equ 0 (
    echo ✅ Reset completado
    echo    Ejecuta 'start' para reiniciar con datos limpios
) else (
    echo ❌ Error durante el reset
)
goto end

:end
endlocal