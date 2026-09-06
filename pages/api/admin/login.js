import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }
  await connectToDatabase();
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Admin credentials are invalid" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ message: "Admin credentials are invalid" });

    const token = jwt.sign({
      id: user._id, email: user.email, name: user.name, role: user.role
    }, "$secret123#", { expiresIn: "12h" });

    return res.status(200).json({ message: "Admin login successful", token });
  } catch (error) {
    console.error("Admin login:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
}
