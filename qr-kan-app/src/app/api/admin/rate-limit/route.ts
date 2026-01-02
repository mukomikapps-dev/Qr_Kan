import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Rate limiting for admin login attempts
 * POST /api/admin/rate-limit
 */
export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const key = `${identifier || ip}`;

    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
      return NextResponse.json({ allowed: true, remaining: MAX_ATTEMPTS - 1 });
    }

    if (record.count >= MAX_ATTEMPTS) {
      const minutesLeft = Math.ceil((record.resetTime - now) / 60000);
      return NextResponse.json(
        {
          allowed: false,
          message: `Too many attempts. Try again in ${minutesLeft} minutes.`,
          resetTime: record.resetTime,
        },
        { status: 429 }
      );
    }

    record.count++;
    rateLimitMap.set(key, record);

    return NextResponse.json({
      allowed: true,
      remaining: MAX_ATTEMPTS - record.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




