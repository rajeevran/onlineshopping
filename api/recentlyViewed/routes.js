import { connectToDatabase } from "@/lib/mongodb";
import RecentlyViewed from "@/models/RecentlyViewed";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await RecentlyViewed.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await RecentlyViewed.create(data);
  return Response.json(newProduct);
}
