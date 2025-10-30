import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await Product.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await Product.create(data);
  return Response.json(newProduct);
}
