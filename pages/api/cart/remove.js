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

    const { productId, quantity } = req.body || {};

    const cart = await Cart.findOne({
      user: decoded.id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    item.quantity -= Number(quantity || 1);

    if (item.quantity <= 0) {
      cart.items = cart.items.filter(
        (i) => i.product.toString() !== productId
      );
    }

    cart.totalAmount = cart.items.reduce(
      (sum, item) =>
        sum + item.quantity * item.price,
      0
    );

    cart.totalQuantity = cart.items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    console.error("Remove cart error:", error);

    return res.status(500).json({
      message: "Unable to remove item",
    });
  }
}