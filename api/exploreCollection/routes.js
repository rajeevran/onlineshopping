import { connectToDatabase } from "@/lib/mongodb";
import ExploreCollection from "@/models/ExploreCollection";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await ExploreCollection.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await ExploreCollection.create(data);
  return Response.json(newProduct);
}
