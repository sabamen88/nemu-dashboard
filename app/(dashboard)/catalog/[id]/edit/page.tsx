export const dynamic = "force-dynamic";

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditProductForm from "./edit-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getDemoSeller();

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.sellerId, seller.id)),
  });

  if (!product) notFound();

  return <EditProductForm product={product} />;
}
