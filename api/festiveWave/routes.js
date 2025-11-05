import { connectToDatabase } from "@/lib/mongodb";
import FestiveWave from "@/models/FestiveWave";

// GET – fetch all products
export async function GET() {
  await connectToDatabase();
  const products = await FestiveWave.find();
  return Response.json(products);
}

// POST – create new product
export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newProduct = await FestiveWave.create(data);
  return Response.json(newProduct);
}
