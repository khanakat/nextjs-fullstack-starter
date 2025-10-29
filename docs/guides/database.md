# 💾 Database Guide

Complete database setup and management guide for **Next.js Fullstack Starter**.

## 🎯 Database Options

| Database                                    | Use Case                           | Difficulty | Cost      |
| ------------------------------------------- | ---------------------------------- | ---------- | --------- |
| **[SQLite](#sqlite)**                       | Development, prototyping           | Easy       | Free      |
| **[PostgreSQL Local](#postgresql-local)**   | Development with production parity | Medium     | Free      |
| **[PostgreSQL Docker](#postgresql-docker)** | Consistent dev environment         | Medium     | Free      |
| **[PostgreSQL Cloud](#postgresql-cloud)**   | Production, collaboration          | Easy       | Free tier |

---

## 🔄 Quick Database Switching

The starter includes scripts to quickly switch between databases:

```bash
# Switch to SQLite (fastest setup)
npm run db:sqlite

# Switch to PostgreSQL with Docker
npm run db:postgres:docker

# Switch to local PostgreSQL
npm run db:postgres:local

# Interactive database setup
npm run db:setup
```

---

## 🗃️ SQLite Setup

**Perfect for**: Quick prototyping, development, testing

### **Setup**

```bash
# Switch to SQLite
npm run db:sqlite

# This automatically:
# 1. Updates DATABASE_URL in .env.local
# 2. Runs database migrations
# 3. Seeds with sample data
```

### **Configuration**

```env
# .env.local
DATABASE_URL="file:./dev.db"
```

### **Pros & Cons**

✅ **Pros**: Zero setup, fast, portable  
❌ **Cons**: Single connection, not production-suitable

---

## 🐘 PostgreSQL Local

**Perfect for**: Development with production database features

### **Automatic Setup**

```bash
# One-command setup
npm run db:postgres:local

# This will:
# 1. Check if PostgreSQL is installed
# 2. Install if needed (Windows: Chocolatey, Mac: Homebrew)
# 3. Create database and user
# 4. Configure connection string
# 5. Run migrations and seed data
```

### **Manual Installation**

**Windows:**

```bash
# Using Chocolatey (recommended)
choco install postgresql

# Or download installer
# https://www.postgresql.org/download/windows/
```

**macOS:**

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Ubuntu/Linux:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### **Database Setup**

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE nextjs_fullstack_starter;
CREATE USER starter_user WITH PASSWORD 'starter_password';
GRANT ALL PRIVILEGES ON DATABASE nextjs_fullstack_starter TO starter_user;
\q
```

### **Configuration**

```env
# .env.local
DATABASE_URL="postgresql://starter_user:starter_password@localhost:5432/nextjs_fullstack_starter?schema=public"
```

### **Management Commands**

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
net start postgresql-x64-15      # Windows

# Stop PostgreSQL service
sudo systemctl stop postgresql   # Linux
brew services stop postgresql    # macOS
net stop postgresql-x64-15       # Windows

# Check status
sudo systemctl status postgresql # Linux
brew services list | grep postgres # macOS
```

---

## 🐳 PostgreSQL with Docker

**Perfect for**: Consistent environment, team development

### **Setup**

```bash
# Start PostgreSQL with Docker
npm run db:postgres:docker

# This will:
# 1. Pull PostgreSQL Docker image
# 2. Start container with correct configuration
# 3. Create database
# 4. Set up connection string
# 5. Run migrations and seed data
```

### **Manual Docker Setup**

```bash
# Start PostgreSQL container
docker run --name nextjs-starter-postgres \
  -e POSTGRES_PASSWORD=starter_password \
  -e POSTGRES_USER=starter_user \
  -e POSTGRES_DB=nextjs_fullstack_starter \
  -p 5433:5432 \
  -d postgres:15

# Check container status
docker ps

# View logs
docker logs nextjs-starter-postgres
```

### **Configuration**

```env
# .env.local
DATABASE_URL="postgresql://starter_user:starter_password@localhost:5433/nextjs_fullstack_starter?schema=public"
```

### **Docker Management**

```bash
# Start existing container
docker start nextjs-starter-postgres

# Stop container
docker stop nextjs-starter-postgres

# Remove container (data will be lost)
docker rm nextjs-starter-postgres

# Connect to database
docker exec -it nextjs-starter-postgres psql -U starter_user -d nextjs_fullstack_starter
```

---

## ☁️ PostgreSQL Cloud

**Perfect for**: Production, team collaboration, zero maintenance

### **Neon (Recommended)**

**Features**: Serverless, autoscaling, generous free tier

1. **Create Account**: [https://neon.tech](https://neon.tech)
2. **New Project**: Click "Create Project"
3. **Configure**: Choose region and name
4. **Get Connection**: Copy connection string
5. **Update Environment**:
   ```env
   # .env.local
   DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
   ```

### **Supabase**

**Features**: Full backend-as-a-service, realtime, auth

1. **Create Account**: [https://supabase.com](https://supabase.com)
2. **New Project**: Create new project
3. **Database Settings**: Go to Settings > Database
4. **Connection Info**: Copy URI format
5. **Update Environment**:
   ```env
   # .env.local
   DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
   ```

### **Railway**

**Features**: Simple deployment, integrated hosting

1. **Create Account**: [https://railway.app](https://railway.app)
2. **New Project**: Create project from GitHub
3. **Add PostgreSQL**: Add PostgreSQL service
4. **Get Variables**: Copy DATABASE_URL
5. **Update Environment**:
   ```env
   # .env.local
   DATABASE_URL="postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway"
   ```

### **PlanetScale (MySQL)**

**Features**: Serverless MySQL, branching, scaling

1. **Create Account**: [https://planetscale.com](https://planetscale.com)
2. **New Database**: Create database
3. **Connection**: Get connection string
4. **Update Schema**: Change provider in `schema.prisma`
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

---

## 🔧 Database Operations

### **Schema Management**

```bash
# Apply schema changes (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### **Data Management**

```bash
# Seed database with sample data
npm run db:seed

# Reset database (⚠️ deletes all data)
npm run db:reset

# Open database GUI
npm run db:studio
```

### **Database Inspection**

```bash
# View database structure
npx prisma db pull

# Validate schema
npx prisma validate

# Check connection
npx prisma db execute --preview-feature --stdin <<< "SELECT 1;"
```

---

## 📊 Schema Overview

### **Current Models**

```prisma
// User (managed by Clerk)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  posts     Post[]
}

// Posts with rich content
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Tagging system
model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}
```

### **Adding Custom Models**

1. **Edit Schema**: Modify `prisma/schema.prisma`
2. **Generate Migration**: `npx prisma migrate dev`
3. **Update Seed**: Add sample data in `prisma/seed.ts`
4. **Generate Client**: `npx prisma generate`

---

## 🔐 Security Best Practices

### **Connection Security**

```env
# Always use SSL in production
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Use connection pooling
DATABASE_URL="postgresql://user:pass@host:port/db?pgbouncer=true"
```

### **Environment Variables**

```bash
# Different URLs per environment
DATABASE_URL_DEVELOPMENT="postgresql://..."
DATABASE_URL_TEST="postgresql://..."
DATABASE_URL_PRODUCTION="postgresql://..."
```

### **Access Control**

```sql
-- Create limited user for application
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

---

## 📈 Performance Optimization

### **Indexing**

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_posts_author_id ON posts(author_id);
CREATE INDEX CONCURRENTLY idx_posts_published ON posts(published) WHERE published = true;
CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at DESC);
```

### **Query Optimization**

```typescript
// Use select to limit data
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    author: {
      select: { id: true, name: true },
    },
  },
});

// Use pagination
const posts = await prisma.post.findMany({
  take: 10,
  skip: page * 10,
  orderBy: { createdAt: "desc" },
});
```

### **Connection Pooling**

```typescript
// lib/prisma.ts - Production configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
```

---

## 🚨 Troubleshooting

### **Connection Issues**

**"Can't reach database server"**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list               # macOS
sc query postgresql-x64-15       # Windows

# Test connection manually
psql -h localhost -p 5432 -U your_user -d your_database
```

**"Password authentication failed"**

```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
\q
```

### **Migration Errors**

**"Migration failed"**

```bash
# Check migration status
npx prisma migrate status

# Reset migrations (⚠️ development only)
npx prisma migrate reset

# Force push schema
npx prisma db push --force-reset
```

### **Performance Issues**

**Slow queries**

```bash
# Enable query logging
# Add to postgresql.conf:
log_statement = 'all'
log_min_duration_statement = 1000

# Analyze slow queries
npx prisma studio
```

---

## 📚 Additional Resources

- **[Prisma Documentation](https://www.prisma.io/docs)** - Complete Prisma guide
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)** - Official PostgreSQL docs
- **[Database Design Guide](./database-design.md)** - Schema design best practices
- **[Deployment Guide](./deployment.md)** - Production database setup
