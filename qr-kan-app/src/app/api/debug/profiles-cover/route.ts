import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to fetch from Supabase directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: "Missing Supabase credentials",
        url: supabaseUrl ? "has url" : "missing url",
        key: supabaseKey ? "has key" : "missing key"
      }, { status: 500 });
    }

    // Query profiles with cover_image_url
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=username,displayName:display_name,cover_image_url&limit=10`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Supabase error: ${response.status}`,
        message: await response.text()
      }, { status: 500 });
    }

    const data = await response.json();
    const withCover = data.filter((p: Record<string, unknown>) => p.cover_image_url).length;
    const withoutCover = data.filter((p: Record<string, unknown>) => !p.cover_image_url).length;

    return NextResponse.json({
      total: data.length,
      withCover,
      withoutCover,
      samples: data.slice(0, 5),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
