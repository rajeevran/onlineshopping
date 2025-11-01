import { connectToDatabase } from "@/lib/mongodb";
import HomeProduct from "@/models/HomeProduct";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await HomeProduct.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await HomeProduct.create(data);
  return Response.json(newProduct);
}
