import { connectToDatabase } from "@/lib/mongodb";
import RecommendedProduct from "@/models/RecommendedProduct";
import { NextResponse } from "next/server";

// GET /api/products/:id
export async function GET(req, { params }) {
  await connectToDatabase();
  const product = await RecommendedProduct.findById(params.id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

// PUT /api/products/:id
export async function PUT(req, { params }) {
  await connectToDatabase();
  const data = await req.json();
  const updated = await RecommendedProduct.findByIdAndUpdate(params.id, data, { new: true });
  return NextResponse.json(updated);
}

// DELETE /api/products/:id
export async function DELETE(req, { params }) {
  await connectToDatabase();
  await RecommendedProduct.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Product deleted" });
}
