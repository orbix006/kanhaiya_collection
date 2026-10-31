import { NextRequest, NextResponse } from "next/server";
import { getShopProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get("category") || searchParams.get("categorySlug") || undefined;
    const searchQuery = searchParams.get("q") || searchParams.get("search") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const availabilityParam = searchParams.get("availability");
    const availability =
      availabilityParam === "in-stock" || availabilityParam === "out-of-stock"
        ? availabilityParam
        : undefined;
    const festival = searchParams.get("festival") || undefined;
    const material = searchParams.get("material") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const page = searchParams.get("page") ? Math.max(1, parseInt(searchParams.get("page")!, 10)) : 1;
    const pageSize = searchParams.get("pageSize") ? Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize")!, 10))) : 12;

    const result = await getShopProducts({
      categorySlug,
      searchQuery,
      minPrice,
      maxPrice,
      availability,
      festival,
      material,
      sort,
      page,
      pageSize,
    });

    const safeProducts = Array.isArray(result?.products) ? result.products : [];

    return NextResponse.json(
      {
        success: true,
        data: safeProducts,
        products: safeProducts,
        totalCount: result?.totalCount || 0,
        page: result?.page || 1,
        pageSize: result?.pageSize || pageSize,
        totalPages: result?.totalPages || 0,
        activeCategory: result?.activeCategory || null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products.",
        data: [],
        products: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
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

