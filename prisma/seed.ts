import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient({
  errorFormat: "pretty",
});

// Helper function to find tags by name
function findTagByName(tags: { id: string; name: string }[], tagName: string) {
  const tag = tags.find((tag) => tag.name === tagName);
  if (!tag) {
    throw new Error(`Tag "${tagName}" not found`);
  }
  return tag;
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Test connection first
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed");
    console.log("\n💡 Make sure PostgreSQL is running:");
    console.log("   • Docker: npm run postgres:docker:start");
    console.log("   • Local:  npm run postgres:local:start");
    console.log("   • Check DATABASE_URL in .env.local");
    throw error;
  }

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "technology" },
      update: {},
      create: {
        name: "Technology",
        slug: "technology",
        description: "All things tech-related",
        color: "#3b82f6",
      },
    }),
    prisma.category.upsert({
      where: { slug: "design" },
      update: {},
      create: {
        name: "Design",
        slug: "design",
        description: "UI/UX and graphic design content",
        color: "#ef4444",
      },
    }),
    prisma.category.upsert({
      where: { slug: "development" },
      update: {},
      create: {
        name: "Development",
        slug: "development",
        description: "Programming and software development",
        color: "#10b981",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create default tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: "React" },
      update: {},
      create: { name: "React" },
    }),
    prisma.tag.upsert({
      where: { name: "Next.js" },
      update: {},
      create: { name: "Next.js" },
    }),
    prisma.tag.upsert({
      where: { name: "TypeScript" },
      update: {},
      create: { name: "TypeScript" },
    }),
    prisma.tag.upsert({
      where: { name: "TailwindCSS" },
      update: {},
      create: { name: "TailwindCSS" },
    }),
    prisma.tag.upsert({
      where: { name: "Prisma" },
      update: {},
      create: { name: "Prisma" },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      username: "admin",
      hashedPassword: adminPassword,
      bio: "System administrator",
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create demo user
  const demoPassword = await hash("demo123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      username: "demo",
      hashedPassword: demoPassword,
      bio: "Demo user for testing purposes",
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create sample posts
  const samplePost = await prisma.post.create({
    data: {
      title: "Welcome to Next.js Fullstack Starter",
      content: `
# Getting Started

This is a comprehensive Next.js fullstack starter built with modern technologies:

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Prisma** - Next-generation ORM
- **Clerk/NextAuth** - Authentication solutions
- **Radix UI** - Accessible component primitives
- **Zustand** - State management

## Features

- 🎨 Modern UI with shadcn/ui components
- 🔐 Multiple authentication options
- 📱 Responsive design
- 🗃️ Database with Prisma
- 🚀 Optimized for performance
- 📚 Comprehensive documentation

Start building your next project with confidence!
      `,
      published: true,
      featured: true,
      authorId: adminUser.id,
    },
  });

  // Connect post to category and tags
  await prisma.postCategory.create({
    data: {
      postId: samplePost.id,
      categoryId: categories[2].id, // Development category
    },
  });

  await Promise.all([
    prisma.postTag.create({
      data: {
        postId: samplePost.id,
        tagId: findTagByName(tags, "Next.js").id,
      },
    }),
    prisma.postTag.create({
      data: {
        postId: samplePost.id,
        tagId: findTagByName(tags, "TypeScript").id,
      },
    }),
  ]);

  console.log(`✅ Created sample post: ${samplePost.title}`);

  // Create default settings
  const settings = await Promise.all([
    prisma.settings.upsert({
      where: { key: "site_title" },
      update: {},
      create: {
        key: "site_title",
        value: "Next.js Fullstack Starter",
        description: "The title of the website",
      },
    }),
    prisma.settings.upsert({
      where: { key: "site_description" },
      update: {},
      create: {
        key: "site_description",
        value:
          "Production-ready Next.js 14 fullstack starter with modern technologies",
        description: "The description of the website",
      },
    }),
    prisma.settings.upsert({
      where: { key: "allow_registration" },
      update: {},
      create: {
        key: "allow_registration",
        value: "true",
        description: "Whether to allow new user registrations",
      },
    }),
  ]);

  console.log(`✅ Created ${settings.length} settings`);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
