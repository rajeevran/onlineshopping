import { connectToDatabase } from "../../../lib/mongodb";
import Cart from "../../../models/Cart";
import jwt from "jsonwebtoken";

const JWT_SECRET = "$secret123#";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  try {
    // ---------------------------------------
    // Get token
    // ---------------------------------------
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // ---------------------------------------
    // No token
    // ---------------------------------------
    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    // ---------------------------------------
    // Verify token
    // ---------------------------------------
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error("Get cart authentication error:", error.message);

      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    // ---------------------------------------
    // Database
    // ---------------------------------------
    await connectToDatabase();

    const cart = await Cart.findOne({
      user: decoded.id,
    }).populate("items.product");

    // No cart yet
    if (!cart) {
      return res.status(200).json({
        items: [],
        totalAmount: 0,
        totalQuantity: 0,
      });
    }

    return res.status(200).json({
      items: Array.isArray(cart.items)
        ? cart.items
        : [],
      totalAmount: Number(cart.totalAmount || 0),
      totalQuantity: Number(cart.totalQuantity || 0),
    });
  } catch (error) {
    console.error("Get cart API error:", error);

    return res.status(500).json({
      message: "Unable to get cart",
    });
  }
}