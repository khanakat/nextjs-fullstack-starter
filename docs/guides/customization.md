# 🎨 Customization Guide

Make the **Next.js Fullstack Starter** truly yours! This guide covers theming, branding, and component customization.

## 🎯 Quick Customization Checklist

- [ ] **App Name & Branding** - Update titles and logos
- [ ] **Color Scheme** - Customize your brand colors
- [ ] **Typography** - Choose fonts and text styles
- [ ] **Layout & Components** - Modify UI components
- [ ] **Database Schema** - Add your data models
- [ ] **Features** - Add custom functionality

---

## 🏷️ App Name & Branding

### **Update App Metadata**

**Root Layout (`app/layout.tsx`):**
```tsx
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your amazing app description',
  keywords: ['your', 'keywords', 'here'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Company',
}
```

**Package.json:**
```json
{
  "name": "your-app-name",
  "description": "Your app description",
  "author": "Your Name <email@example.com>",
  "homepage": "https://yourapp.com"
}
```

### **Logo & Favicon**

**Replace these files in `/public`:**
```
public/
├── favicon.ico          # Browser tab icon (32x32)
├── apple-touch-icon.png # iOS home screen (180x180)
├── icon-192.png         # Android home screen (192x192)
├── icon-512.png         # PWA icon (512x512)
└── logo.svg             # Main app logo
```

**Update Logo Component:**
```tsx
// components/logo.tsx
import Image from 'next/image'

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Your App Name"
      width={120}
      height={40}
      className={className}
    />
  )
}
```

---

## 🎨 Color Customization

### **TailwindCSS Configuration**

**Edit `tailwind.config.ts`:**
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Your brand colors
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          500: '#0ea5e9',  // Primary brand color
          600: '#0284c7',
          900: '#0c4a6e',
        },
        // Custom semantic colors
        primary: {
          DEFAULT: '#0ea5e9',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#64748b',
          foreground: '#ffffff',
        },
        // Override shadcn/ui colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... add more custom colors
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-cal)', 'Cal Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### **CSS Variables**

**Update `app/globals.css`:**
```css
@tailwind base;
@tailwind components;  
@tailwind utilities;

@layer base {
  :root {
    /* Light theme colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 199 89% 48%;        /* Your brand blue */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    /* Add more custom properties */
  }

  .dark {
    /* Dark theme colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 199 89% 48%;        /* Same brand blue */
    --primary-foreground: 222.2 84% 4.9%;
    /* Add more dark theme colors */
  }
}

/* Custom component styles */
.gradient-brand {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
}
```

---

## ✍️ Typography & Fonts

### **Custom Fonts**

**Install fonts:**
```bash
npm install @next/font
```

**Configure in `app/layout.tsx`:**
```tsx
import { Inter, Cal_Sans } from 'next/font/google'
import localFont from 'next/font/local'

// Google Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const calSans = Cal_Sans({
  subsets: ['latin'],
  variable: '--font-cal',
})

// Local font
const customFont = localFont({
  src: '../public/fonts/custom-font.woff2',
  variable: '--font-custom',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${calSans.variable} ${customFont.variable}`}
    >
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
```

### **Typography Scale**

**Add to `tailwind.config.ts`:**
```ts
theme: {
  extend: {
    fontSize: {
      // Custom font sizes
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      // Brand-specific sizes
      'hero': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      'display': ['3.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
    },
  },
}
```

---

## 🧩 Component Customization

### **Button Variants**

**Extend `components/ui/button.tsx`:**
```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        // Your custom variants
        gradient: "gradient-brand text-white hover:opacity-90",
        rounded: "rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
        neon: "bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
        // Custom sizes
        xl: "h-12 px-10 text-lg",
        hero: "h-14 px-12 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### **Custom Card Component**

**Create `components/ui/custom-card.tsx`:**
```tsx
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CustomCardProps {
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
  gradient?: boolean
  className?: string
}

export function CustomCard({ 
  title, 
  children, 
  icon, 
  gradient = false, 
  className 
}: CustomCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
      gradient && "gradient-brand text-white border-0",
      className
    )}>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        {icon && (
          <div className="mr-2 p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
        )}
        <CardTitle className={cn(
          "text-lg font-semibold",
          gradient && "text-white"
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
```

---

## 🎪 Theme System

### **Enhanced Theme Provider**

**Create `components/theme-provider.tsx`:**
```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'red'

interface ThemeContextType {
  theme: Theme
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [accentColor, setAccentColor] = useState<AccentColor>('blue')

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Apply accent color
    root.setAttribute('data-accent', accentColor)
  }, [theme, accentColor])

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

### **Theme Selector Component**

**Create `components/theme-selector.tsx`:**
```tsx
'use client'

import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Moon, Sun, Palette } from 'lucide-react'

export function ThemeSelector() {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {['blue', 'green', 'purple', 'orange', 'red'].map((color) => (
          <DropdownMenuItem 
            key={color}
            onClick={() => setAccentColor(color as any)}
            className="flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded-full bg-${color}-500`} />
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 💾 Database Schema Customization

### **Add Your Models**

**Edit `prisma/schema.prisma`:**
```prisma
// Your custom models
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  image       String?
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  orderItems  OrderItem[]
  
  @@map("products")
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
  
  @@map("categories")
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  status    OrderStatus @default(PENDING)
  total     Decimal     @db.Decimal(10, 2)
  createdAt DateTime    @default(now())
  
  // Relations
  items     OrderItem[]
  
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2)
  
  // Relations
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### **Generate and Migrate**

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add-ecommerce-models

# Seed with new data
npm run db:seed
```

---

## ⚡ Custom Features

### **Add API Routes**

**Create `app/api/products/route.ts`:**
```tsx
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    const product = await prisma.product.create({
      data,
      include: {
        category: true,
      },
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
```

### **Custom Hooks**

**Create `hooks/use-products.ts`:**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category: {
    id: string
    name: string
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Omit<Product, 'id' | 'category'> & { categoryId: string }) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create product')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

---

## 📱 Responsive Customization

### **Breakpoint System**

**Add custom breakpoints to `tailwind.config.ts`:**
```ts
theme: {
  screens: {
    'xs': '475px',
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
    // Custom breakpoints
    'mobile': {'max': '767px'},
    'tablet': {'min': '768px', 'max': '1023px'},
    'desktop': {'min': '1024px'},
  },
}
```

### **Responsive Components**

```tsx
// Mobile-first responsive component
function ResponsiveCard() {
  return (
    <div className="
      w-full p-4 
      sm:w-1/2 sm:p-6 
      lg:w-1/3 lg:p-8
      xl:w-1/4
    ">
      <Card className="h-full">
        {/* Card content */}
      </Card>
    </div>
  )
}
```

---

## 📚 Next Steps

Ready to take customization further? Explore these areas:

| Area | Description | Difficulty |
|------|-------------|------------|
| **[Animation System](./examples/animations.md)** | Add smooth transitions | Medium |
| **[PWA Features](./examples/pwa.md)** | Offline functionality | Hard |
| **[Internationalization](./examples/i18n.md)** | Multi-language support | Medium |
| **[Advanced Theming](./examples/advanced-theming.md)** | Complex theme system | Hard |

---

## 🆘 Troubleshooting

### **Styling Issues**

```bash
# Clear Tailwind cache
rm -rf .next
npm run dev

# Check class conflicts
npx tailwind-merge --help
```

### **Font Loading Problems**

- Ensure font files are in `/public/fonts/`
- Check font variable names match CSS
- Verify font loading in Network tab

### **Theme Not Applying**

- Check `ThemeProvider` wraps your app
- Verify CSS variables are defined
- Test with browser dev tools

---

## 🤝 Contribute Your Customizations

Created something amazing? Share with the community:

1. **Fork** the repository
2. **Add** your customization to `/examples`
3. **Document** the implementation
4. **Submit** a pull request

---

**🎨 Happy customizing!** Make this template uniquely yours.