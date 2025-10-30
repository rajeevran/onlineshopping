import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  await connectToDatabase();
  const users = await User.find();
  return Response.json(users);
}

export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();
  const newUser = await User.create(data);
  return Response.json(newUser);
}
