import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const users = await User.find();
    return res.status(200).json(users);
  } else if (req.method === "POST") {
    const newUser = await User.create(req.body);
    return res.status(201).json(newUser);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
