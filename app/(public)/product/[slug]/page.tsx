import ProductDetailPage, {
  generateMetadata as generateProductMetadata,
} from "@/app/(public)/shop/product/[slug]/page";

export const dynamic = "force-dynamic";

export const generateMetadata = generateProductMetadata;

export default ProductDetailPage;
