#!/bin/bash
# Script de inicialización para PostgreSQL en Docker
# Este script se ejecuta automáticamente al iniciar el contenedor por primera vez

set -e

echo "🚀 Inicializando base de datos PostgreSQL..."

# Crear usuario adicional para la aplicación (opcional)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Crear usuario de aplicación (opcional)
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fullstack_app') THEN
            CREATE USER fullstack_app WITH PASSWORD 'app_password_123';
        END IF;
    END
    \$\$;

    -- Conceder permisos
    GRANT ALL PRIVILEGES ON DATABASE fullstack_template TO fullstack_app;
    
    -- Configurar permisos para esquemas futuros
    GRANT ALL ON SCHEMA public TO fullstack_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fullstack_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fullstack_app;
    
    -- Crear extensiones útiles
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Configuraciones de rendimiento
    ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
    ALTER SYSTEM SET max_connections = 100;
    ALTER SYSTEM SET shared_buffers = '256MB';
    
    SELECT 'Base de datos inicializada correctamente ✅' as status;
EOSQL

echo "✅ Inicialización completada"