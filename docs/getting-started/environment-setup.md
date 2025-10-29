# 🔧 Environment Setup

This guide covers all environment variables needed to configure your **Next.js Fullstack Starter** application.

## 📋 Environment Files

The project uses different environment files for different purposes:

| File              | Purpose                         | Committed |
| ----------------- | ------------------------------- | --------- |
| `.env.example`    | Template with all variables     | ✅ Yes    |
| `.env.local`      | Local development (your values) | ❌ No     |
| `.env.production` | Production deployment           | ❌ No     |

## 🚀 Quick Setup

1. **Copy the template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values** (see sections below)

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

---

## 🔐 Authentication (Clerk)

### **Required Variables**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### **How to Get Clerk Keys**

1. **Create Account**: Go to [https://clerk.com](https://clerk.com)
2. **Create Application**: Click "Add Application"
3. **Get Keys**: From your dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - API Keys tab
   - `CLERK_SECRET_KEY` - API Keys tab

### **Optional Clerk Variables**

```env
# Custom redirect URLs
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Custom domain (production only)
CLERK_DOMAIN=your-domain.com
```

---

## 💾 Database Configuration

### **SQLite (Development)**

```env
DATABASE_URL="file:./dev.db"
```

- **Pros**: Zero setup, great for development
- **Cons**: Not suitable for production

### **PostgreSQL (Recommended)**

**Local PostgreSQL:**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/myapp"
```

**Docker PostgreSQL:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/nextjs_fullstack_starter"
```

**Cloud PostgreSQL (Supabase, Neon, etc.):**

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

### **Getting PostgreSQL URLs**

**Option 1: Docker (Easiest)**

```bash
npm run db:postgres:docker
# URL will be provided after setup
```

**Option 2: Local PostgreSQL**

```bash
# Install PostgreSQL locally first
npm run db:postgres:local
```

**Option 3: Cloud Provider**

- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Railway](https://railway.app) - Simple deployment
- [PlanetScale](https://planetscale.com) - MySQL alternative

---

## 🌍 Optional Environment Variables

### **Application Settings**

```env
# App metadata
NEXT_PUBLIC_APP_NAME="Next.js Fullstack Starter"
NEXT_PUBLIC_APP_DESCRIPTION="Production-ready fullstack template"

# URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### **Email Configuration (Future)**

```env
# For sending emails (when implemented)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com
```

### **File Upload (Future)**

```env
# For file storage (when implemented)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
```

### **Analytics (Future)**

```env
# For tracking (when implemented)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_PROJECT_ID=your-project-id
```

---

## 🎯 Environment-Specific Configurations

### **Development (.env.local)**

```env
# Debug mode
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true

# Local URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"

# Clerk development keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### **Production (.env.production)**

```env
# Production mode
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false

# Production URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL="postgresql://..."

# Clerk production keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

---

## 🔒 Security Best Practices

### **✅ Do's**

- ✅ **Never commit** `.env.local` or `.env.production`
- ✅ **Use different keys** for development and production
- ✅ **Rotate secrets** regularly
- ✅ **Use strong passwords** for database connections
- ✅ **Prefix public variables** with `NEXT_PUBLIC_`

### **❌ Don'ts**

- ❌ **Don't share** secret keys in chat/email
- ❌ **Don't use** production keys in development
- ❌ **Don't hardcode** secrets in your code
- ❌ **Don't commit** real credentials to git

---

## 🧪 Validation

### **Check Environment Variables**

```bash
# View all environment variables
npm run env:check

# Test database connection
npm run db:test

# Validate Clerk setup
npm run auth:test
```

### **Common Variable Patterns**

| Type         | Pattern                    | Example                          |
| ------------ | -------------------------- | -------------------------------- |
| Clerk Public | `pk_test_*` or `pk_live_*` | `pk_test_Y2xlcms...`             |
| Clerk Secret | `sk_test_*` or `sk_live_*` | `sk_test_1yDo8Q...`              |
| Database     | `postgresql://` or `file:` | `postgresql://user:pass@host/db` |
| URLs         | `http://` or `https://`    | `https://myapp.com`              |

---

## 🆘 Troubleshooting

### **Environment Variables Not Loading**

1. **Check file location**: Must be in project root
2. **Restart server**: Changes require restart
3. **Check syntax**: No spaces around `=`
4. **Check naming**: Must start with `NEXT_PUBLIC_` for client-side

### **Clerk Authentication Errors**

```bash
# Check keys are set
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Verify format
# Should start with pk_test_ or pk_live_
# Should start with sk_test_ or sk_live_
```

### **Database Connection Errors**

```bash
# Test connection
npm run db:test

# Reset database
npm run db:reset

# Switch to SQLite for testing
npm run db:sqlite
```

---

## 📚 Additional Resources

- **[Clerk Documentation](https://clerk.com/docs)** - Authentication setup
- **[Prisma Documentation](https://www.prisma.io/docs)** - Database configuration
- **[Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)** - Official guide
- **[Deployment Guide](../guides/deployment.md)** - Production environment setup
