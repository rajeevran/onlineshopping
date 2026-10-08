import crypto from "crypto";
import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";
import jwt from "jsonwebtoken";

const STATIC_OTP = "1234";
const JWT_SECRET = "$secret123#";
const API_KEY = process.env.TWOFACTOR_API_KEY;
const BASE = "https://2factor.in/API/V1";
const OTP_LENGTH = 4;

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

async function providerRequest(path) {
  const url = `${BASE}/${API_KEY}/${path}`;

  console.log("2Factor URL:", url.replace(API_KEY, "***"));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const raw = await response.text();

  console.log("2Factor HTTP:", response.status);
  console.log("2Factor response:", raw);

  let data = {};

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `OTP provider returned invalid response. HTTP ${response.status}: ${raw}`
    );
  }

  if (
    !response.ok ||
    String(data.Status || "").toLowerCase() !== "success"
  ) {
    throw new Error(
      data.Details ||
      data.Message ||
      `OTP provider request failed. HTTP ${response.status}`
    );
  }

  return data;
}

function generateOtp() {
  // Always generates exactly 4 numeric digits, including leading zeroes.
  return String(crypto.randomInt(0, 10000)).padStart(OTP_LENGTH, "0");
}


export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    await connectToDatabase();
    const { action, phone, otp, sessionId } = req.body || {};
    const normalizedPhone = normalizePhone(phone);

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit phone number." });
    }

    const mobile = normalizePhone(phone);

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        message: "Enter a valid 10-digit Indian mobile number.",
      });
    }

    if (action === "send") {
      // Development OTP service: no real SMS is sent yet.
      // The verification code is intentionally static until an SMS provider is connected.
      const generatedOtp = generateOtp();
      const templateName = "OTP1"; // Replace with your actual template name if needed
      const result = await providerRequest(
        `SMS/${encodeURIComponent(`91${mobile}`)}/${encodeURIComponent(generatedOtp)}/${encodeURIComponent(templateName)}`
      );

      return res.status(200).json({
        success: true,
        sessionId: result.Details,
        message: "OTP sent.",
      });
      // return res.status(200).json({
      //   success: true,
      //   message: "OTP sent successfully.",
      //   developmentOtp: STATIC_OTP,
      // });
    }

    if (action === "verify") {
      const enteredOtp = String(otp || "").trim();

      if (!sessionId || !/^\d{4}$/.test(enteredOtp)) {
        return res.status(400).json({
          message: "Enter the 4-digit OTP.",
        });
      }

      await providerRequest(
        `SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(enteredOtp)}`
      );

      const user = await User.findOne({ phone: mobile });
      if (!user) {
        return res.status(404).json({
          message: "Account not found. Please sign up first.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Phone verified.",
        token: tokenForUser(user),
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role || "user",
        },
      });



      // if (String(otp || "").trim() !== STATIC_OTP) {
      //   return res.status(401).json({ message: "Invalid OTP. Please try again." });
      // }

      // let user = await User.findOne({ phone: normalizedPhone });

      // // Phone-only onboarding: create a lightweight customer account on first verification.
      // if (!user) {
      //   user = await User.create({
      //     firstName: "",
      //     lastName: "",
      //     phone: normalizedPhone,
      //     // Existing deployments may have a non-sparse unique email index.
      //     // Keep a private unique placeholder so phone-only accounts work safely.
      //     email: `phone_${normalizedPhone}@noadua.local`,
      //     role: "user",
      //   });
      // }

      // return res.status(200).json({
      //   success: true,
      //   message: "Phone verified successfully.",
      //   token: tokenForUser(user),
      //   user: {
      //     id: user._id,
      //     phone: user.phone,
      //     role: user.role,
      //   },
      // });
    }

    return res.status(400).json({ message: "Invalid OTP action." });
  } catch (error) {
    console.error("OTP authentication error:", error);
    return res.status(500).json({ message: "Unable to process OTP right now." });
  }
}
