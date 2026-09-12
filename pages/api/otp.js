import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";
import jwt from "jsonwebtoken";

const STATIC_OTP = "1234";
const JWT_SECRET = "$secret123#";

function normalizePhone(value = "") {
  const raw = String(value).trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

function tokenForUser(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.firstName || user.phone,
      role: user.role || "user",
      phone: user.phone,
    },
    JWT_SECRET,
    { expiresIn: "9999y" }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    await connectToDatabase();
    const { action, phone, otp } = req.body || {};
    const normalizedPhone = normalizePhone(phone);

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit phone number." });
    }

    if (action === "send") {
      // Development OTP service: no real SMS is sent yet.
      // The verification code is intentionally static until an SMS provider is connected.
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully.",
        developmentOtp: STATIC_OTP,
      });
    }

    if (action === "verify") {
      if (String(otp || "").trim() !== STATIC_OTP) {
        return res.status(401).json({ message: "Invalid OTP. Please try again." });
      }

      let user = await User.findOne({ phone: normalizedPhone });

      // Phone-only onboarding: create a lightweight customer account on first verification.
      if (!user) {
        user = await User.create({
          firstName: "",
          lastName: "",
          phone: normalizedPhone,
          // Existing deployments may have a non-sparse unique email index.
          // Keep a private unique placeholder so phone-only accounts work safely.
          email: `phone_${normalizedPhone}@noadua.local`,
          role: "user",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Phone verified successfully.",
        token: tokenForUser(user),
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    return res.status(400).json({ message: "Invalid OTP action." });
  } catch (error) {
    console.error("OTP authentication error:", error);
    return res.status(500).json({ message: "Unable to process OTP right now." });
  }
}
