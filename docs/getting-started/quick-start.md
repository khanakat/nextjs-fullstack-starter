# ⚡ Quick Start Guide

Get your **Next.js Fullstack Starter** up and running in under 5 minutes!

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **npm, yarn, or pnpm** (npm comes with Node.js)
- **Git** ([Download here](https://git-scm.com/))

## 🚀 5-Minute Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/khanakat/nextjs-fullstack-starter.git
cd nextjs-fullstack-starter
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

**Edit `.env.local`** with your values:

```env
# Clerk Authentication (Get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (SQLite for quick start)
DATABASE_URL="file:./dev.db"
```

### Step 4: Set Up Database

**Option A: Quick SQLite Setup (Recommended for first time)**

```bash
npm run db:sqlite
```

**Option B: PostgreSQL with Docker**

```bash
npm run db:postgres:docker
```

### Step 5: Start Development Server

```bash
npm run dev
```

🎉 **That's it!** Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 What You Get

After completing the quick start, you'll have:

### ✅ **Working Application**

- 🔐 **Authentication** - Sign up/in functionality
- 🏠 **Landing page** - Beautiful homepage
- 📊 **Dashboard** - Protected user area
- 💾 **Database** - Ready for data storage

### ✅ **Development Environment**

- 🔄 **Hot reload** - Instant updates on file changes
- 🔍 **TypeScript** - Full type checking
- 🎨 **TailwindCSS** - Utility-first styling
- 📱 **Responsive** - Works on all devices

---

## 🔧 Available Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:migrate   # Apply database changes
npm run db:seed      # Add sample data
npm run db:studio    # Open database GUI
npm run db:reset     # Reset database

# Utilities
npm run lint         # Check code quality
npm run type-check   # Verify TypeScript
```

---

## 🎪 Try These Features

Now that you're running, try these features:

### 1. **Authentication Flow**

- Visit `/sign-up` to create an account
- Sign in and access the protected dashboard
- Check out the user profile functionality

### 2. **Database Operations**

- Visit `/dashboard` to see sample data
- Try creating, editing, or deleting posts
- Open Prisma Studio: `npm run db:studio`

### 3. **UI Components**

- Check out the component library
- Toggle between light/dark themes
- Explore responsive design on mobile

---

## 🎨 Customization Ideas

Ready to make it your own? Quick customizations:

### **Change App Name**

Edit `app/layout.tsx`:

```tsx
export const metadata = {
  title: "Your App Name",
  description: "Your app description",
};
```

### **Update Colors**

Edit `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      primary: "your-color-here";
    }
  }
}
```

### **Add Your Logo**

Replace files in `public/` folder:

- `favicon.ico` - Browser tab icon
- `logo.svg` - Your app logo

---

## 🚀 Next Steps

Great job! You now have a fully functional fullstack application. Here's what to explore next:

| Step | Description                     | Link                                                 |
| ---- | ------------------------------- | ---------------------------------------------------- |
| 🔐   | **Set up production auth**      | [Authentication Guide](../guides/authentication.md)  |
| 💾   | **Configure PostgreSQL**        | [Database Guide](../guides/database.md)              |
| 🏗️   | **Understand the architecture** | [Architecture Overview](../architecture/overview.md) |
| 🚀   | **Deploy your app**             | [Deployment Guide](../guides/deployment.md)          |

---

## 🆘 Troubleshooting

### **Port already in use**

```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

### **Module not found errors**

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Database connection issues**

```bash
# Reset database
npm run db:reset
# Or switch to SQLite
npm run db:sqlite
```

### **Environment variables not loading**

- Ensure `.env.local` exists in project root
- Restart development server after changes
- Check for typos in variable names

---

## 🤝 Need Help?

- **📖 Documentation**: Check other guides in [/docs](../)
- **🐛 Issues**: [Report bugs](https://github.com/khanakat/nextjs-fullstack-starter/issues)
- **💬 Discussions**: [Ask questions](https://github.com/khanakat/nextjs-fullstack-starter/discussions)

---

**Happy coding! 🎉** You're now ready to build amazing fullstack applications.
