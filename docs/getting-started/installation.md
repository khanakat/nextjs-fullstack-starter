# 🏠 Local Setup - Quick Guide

This guide will help you configure PostgreSQL locally on Windows for the Next.js Fullstack Starter.

## 🚀 Option 1: Local PostgreSQL (Recommended)

### **3-step installation:**

```bash
# 1. Install PostgreSQL automatically
npm run postgres:local:install

# 2. Create project database
npm run postgres:local:create-db

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fullstack_template?schema=public"
```

### **Useful commands:**
```bash
# Service management
npm run postgres:local:start    # Start PostgreSQL
npm run postgres:local:stop     # Stop PostgreSQL
npm run postgres:local:status   # Check status

# View complete help
npm run postgres:local:help
```

---

## 🐳 Option 2: Docker (Alternative)

### **If you prefer Docker:**

```bash
# 1. Check that Docker Desktop is running
# 2. Start PostgreSQL with tools
npm run postgres:docker:start

# 3. Configure .env.local
# DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/fullstack_template?schema=public"
```

### **Included tools:**
- **Adminer**: http://localhost:8080 (simple web admin)
- **PgAdmin**: http://localhost:5050 (advanced admin)
  - User: `admin@fullstack.local`
  - Password: `admin123`

### **Docker commands:**
```bash
npm run postgres:docker:start     # Start everything
npm run postgres:docker:stop      # Stop
npm run postgres:docker:status    # Status
npm run postgres:docker:shell     # Direct PostgreSQL access
```

---

## 📋 Después de configurar PostgreSQL

### **1. Configurar base de datos:**
```bash
# Aplicar esquema a la base de datos
npm run db:push

# Poblar con datos de ejemplo
npm run db:seed

# Abrir administrador visual
npm run db:studio
```

### **2. Verificar conexión:**
```bash
# Verificar que todo funcione
npm run dev
# Ir a http://localhost:3000/dashboard
```

---

## ⚠️ Solución de Problemas

### **PostgreSQL Local no inicia:**
```bash
# Verificar si el servicio existe
npm run postgres:local:status

# Reinstalar si es necesario
npm run postgres:local:install
```

### **Docker no funciona:**
```bash
# Verificar Docker Desktop
docker --version

# Reiniciar contenedores
npm run postgres:docker:restart

# Ver logs de error
npm run postgres:docker:logs
```

### **Error de conexión:**
1. Verificar que PostgreSQL esté ejecutándose
2. Verificar DATABASE_URL en `.env.local`
3. Verificar que la base de datos existe:
   ```bash
   npm run postgres:local:create-db
   # o para Docker:
   npm run postgres:docker:shell
   ```

---

## 🔄 Cambiar entre bases de datos

```bash
# Cambiar a PostgreSQL
npm run db:switch:postgresql
npm run db:push

# Cambiar a SQLite (desarrollo rápido)
npm run db:switch:sqlite  
npm run db:push
```

---

## 📞 ¿Necesitas ayuda?

```bash
# Ver todos los comandos disponibles
npm run postgres:local:help
npm run postgres:docker:help

# Scripts de base de datos
npm run db:help
```

**💡 Tip**: Para desarrollo diario, recomendamos PostgreSQL local. Para pruebas o si tienes problemas con la instalación local, usa Docker.

---

## 📊 Resumen de URLs

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **App Local** | http://localhost:3000 | Tu usuario Clerk |
| **Prisma Studio** | http://localhost:5555 | - |
| **Adminer (Docker)** | http://localhost:8080 | postgres / postgres123 |
| **PgAdmin (Docker)** | http://localhost:5050 | admin@fullstack.local / admin123 |