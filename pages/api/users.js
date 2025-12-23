import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const users = await User.find();
    return res.status(200).json(users);
  } else if (req.method === "POST") {
    const { name, email, passwordHash } = req.body;

    if (!name || !email || !passwordHash) {
      return res.status(409).end(`All fields are required`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).end(`User already exists`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordHash, salt);

    // Create user
    const user = await User.create({
      ...req.body,
      passwordHash: hashedPassword
    });

    return res.status(201).json(user);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
