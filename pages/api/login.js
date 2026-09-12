import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = "$secret123#";
const STATIC_OTP = "1234";

function normalizePhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

function createToken(user) {
  return jwt.sign({ id: user._id, email: user.email, name: user.firstName || user.phone, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: "9999y" });
}

export default async function handler(req, res) {
  await connectToDatabase();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { phone, otp, email, passwordHash } = req.body || {};

    if (phone && otp !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) return res.status(400).json({ message: "Enter a valid 10-digit phone number." });
      if (String(otp).trim() !== STATIC_OTP) return res.status(401).json({ message: "Invalid OTP. Please try again." });
      const user = await User.findOne({ phone: normalizedPhone });
      if (!user) return res.status(404).json({ message: "Account not found. Please use the signup flow first." });
      return res.status(200).json({ message: "Login successful", token: createToken(user) });
    }

    // Keep legacy email/password login available for existing admin/customer integrations.
    if (!email || !passwordHash) return res.status(400).json({ message: "Phone number and OTP are required" });
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash || !(await bcrypt.compare(passwordHash, user.passwordHash))) return res.status(401).json({ message: "Invalid credential" });
    return res.status(200).json({ message: "Login successful", token: createToken(user) });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
