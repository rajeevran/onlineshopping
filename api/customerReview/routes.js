import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await Review.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await Review.create(data);
  return Response.json(newProduct);
}
