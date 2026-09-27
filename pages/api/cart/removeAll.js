import { connectToDatabase } from "../../../lib/mongodb";
import Cart from "../../../models/Cart";
import jwt from "jsonwebtoken";

const JWT_SECRET = "$secret123#";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  try {
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    await connectToDatabase();

    const cart = await Cart.findOne({
      user: decoded.id,
    });

    if (!cart) {
      return res.status(200).json({
        items: [],
        totalAmount: 0,
        totalQuantity: 0,
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    cart.totalQuantity = 0;

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    console.error("Remove all cart error:", error);

    return res.status(500).json({
      message: "Unable to clear cart",
    });
  }
}