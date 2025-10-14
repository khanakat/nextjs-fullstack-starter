# 🚀 Deployment Guide

Complete guide to deploying your **Next.js Fullstack Starter** application to production.

## 🎯 Deployment Options

| Platform | Difficulty | Cost | Best For |
|----------|------------|------|----------|
| **[Vercel](#vercel)** | Easy | Free tier | Next.js apps (recommended) |
| **[Netlify](#netlify)** | Easy | Free tier | Static sites, SSG |
| **[Railway](#railway)** | Medium | Free tier | Fullstack with DB |
| **[Docker](#docker)** | Hard | Variable | Custom environments |
| **[AWS](#aws)** | Expert | Pay-as-use | Enterprise scale |

---

## 🏆 Vercel (Recommended)

**Perfect for Next.js applications** - Zero configuration deployment.

### **Prerequisites**
- GitHub/GitLab/Bitbucket repository
- Vercel account ([sign up free](https://vercel.com))

### **Step 1: Prepare Environment**

Create `.env.production`:
```env
# Production Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Production database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Production URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://yourdomain.com/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://yourdomain.com/dashboard
```

### **Step 2: Deploy**

**Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel  
vercel login

# Deploy
vercel --prod
```

**Option B: Git Integration**
1. **Connect Repository**: Link your GitHub repo in Vercel dashboard
2. **Configure**: Add environment variables
3. **Deploy**: Push to main branch triggers deployment

### **Step 3: Configure Environment Variables**

In Vercel Dashboard:
1. **Go to**: Project Settings > Environment Variables
2. **Add all variables** from `.env.production`
3. **Set Environment**: Production
4. **Redeploy**: Trigger new deployment

### **Step 4: Custom Domain (Optional)**

1. **Buy Domain**: From any registrar
2. **Add to Vercel**: Project Settings > Domains
3. **Configure DNS**: Add provided records
4. **SSL**: Automatic via Let's Encrypt

---

## 🌊 Netlify

**Great for static sites** with some serverless functions.

### **Deploy Steps**

```bash
# Build for production
npm run build
npm run export  # If using static export

# Deploy via Netlify CLI
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir=out
```

### **Configuration**

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[build.environment]
  NODE_ENV = "production"
```

---

## 🚂 Railway

**Excellent for fullstack apps** with integrated database.

### **Step 1: Setup Railway**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

### **Step 2: Database Setup**

```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables
```

### **Step 3: Deploy**

```bash
# Deploy application
railway up
```

### **Railway Configuration**

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

---

## 🐳 Docker Deployment

**Full control** over deployment environment.

### **Dockerfile**

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder  
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### **Docker Compose**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nextjs_app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### **Deploy Commands**

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## ☁️ AWS Deployment

**Enterprise-grade** scalable deployment.

### **AWS Amplify**

```bash
# Install Amplify CLI
npm i -g @aws-amplify/cli

# Configure AWS
amplify configure

# Initialize
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### **AWS EC2 + RDS**

```bash
# Launch EC2 instance
# Set up RDS PostgreSQL
# Configure security groups
# Deploy with Docker or PM2
```

---

## 🎯 Database Deployment

### **Supabase (Recommended)**

1. **Create Project**: [https://supabase.com](https://supabase.com)
2. **Get Connection String**: Settings > Database
3. **Run Migrations**:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   ```

### **Neon (Serverless)**

1. **Create Database**: [https://neon.tech](https://neon.tech)
2. **Configure Branching**: Development/Production branches
3. **Deploy Schema**: Run migrations on production branch

### **PlanetScale (MySQL)**

1. **Create Database**: [https://planetscale.com](https://planetscale.com)
2. **Create Branch**: Deploy schema to main branch
3. **Promote Changes**: Use deploy requests for schema changes

### **Railway PostgreSQL**

```bash
# Add PostgreSQL to Railway project
railway add postgresql

# Deploy with database included
railway up --service postgresql
```

---

## 🔐 Production Checklist

### **Security**
- [ ] **Environment Variables**: All secrets in production environment
- [ ] **HTTPS**: SSL certificate configured
- [ ] **Clerk Production Keys**: Using `pk_live_` and `sk_live_` keys
- [ ] **Database Security**: Connection string with SSL
- [ ] **CORS**: Configured for production domain
- [ ] **Headers**: Security headers configured

### **Performance**  
- [ ] **Build Optimization**: `npm run build` successful
- [ ] **Image Optimization**: Next.js image optimization enabled
- [ ] **Caching**: CDN and edge caching configured
- [ ] **Database Indexes**: Query performance optimized
- [ ] **Bundle Analysis**: Bundle size optimized

### **Monitoring**
- [ ] **Error Tracking**: Sentry or similar configured
- [ ] **Analytics**: User behavior tracking
- [ ] **Uptime Monitoring**: Health checks configured
- [ ] **Performance Monitoring**: Core Web Vitals tracking

---

## 🔧 Production Configuration

### **Next.js Config**

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['images.clerk.dev'], // Clerk avatars
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',  
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### **Database Production Config**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl"] // For Docker
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🚨 Troubleshooting

### **Build Errors**

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check TypeScript errors
npm run type-check

# Analyze bundle
npm run build && npx @next/bundle-analyzer
```

### **Environment Variable Issues**

```bash
# Test environment loading
node -e "console.log(process.env.DATABASE_URL)"

# Verify Clerk keys format
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | grep -E '^pk_(test|live)_'
```

### **Database Connection**

```bash
# Test database connection
npx prisma db pull

# Check connection string format
echo $DATABASE_URL | grep -E '^postgresql://'

# Test from application
npm run db:test
```

### **SSL/HTTPS Issues**

- **Check Certificate**: Use SSL checker tools
- **Verify Redirects**: HTTP should redirect to HTTPS
- **Update URLs**: All environment variables should use `https://`

---

## 📊 Performance Optimization

### **Next.js Optimizations**

```js
// Enable experimental features
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    optimizeCss: true,
    optimizePackageImports: ['@/components/ui'],
  },
}
```

### **Database Optimizations**

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_posts_author_id ON posts(author_id);
CREATE INDEX CONCURRENTLY idx_posts_published ON posts(published) WHERE published = true;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = $1;
```

---

## 📚 Additional Resources

- **[Vercel Deployment](https://vercel.com/docs)** - Official Vercel documentation
- **[Next.js Deployment](https://nextjs.org/docs/deployment)** - Official Next.js guide  
- **[Prisma Deployment](https://www.prisma.io/docs/guides/deployment)** - Database deployment
- **[Clerk Production](https://clerk.com/docs/deployments/overview)** - Production authentication setup