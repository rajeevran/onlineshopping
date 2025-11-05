import { connectToDatabase } from "@/lib/mongodb";
import RecommendedProduct from "@/models/RecommendedProduct";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await RecommendedProduct.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await RecommendedProduct.create(data);
  return Response.json(newProduct);
}
