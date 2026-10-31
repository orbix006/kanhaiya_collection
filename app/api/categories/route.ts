import { NextRequest, NextResponse } from "next/server";
import { getActiveCategories } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const categories = await getActiveCategories();
    const safeCategories = Array.isArray(categories) ? categories : [];

    return NextResponse.json(
      {
        success: true,
        data: safeCategories,
        categories: safeCategories,
        total: safeCategories.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load categories.",
        data: [],
        categories: [],
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

