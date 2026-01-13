import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const res = NextResponse.redirect(url);
  // Clear demo auth cookie if present
  res.cookies.set("demo_auth", "", { httpOnly: false, path: "/", maxAge: 0 });
  return res;
}
