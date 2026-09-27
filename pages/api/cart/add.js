import Cart from "../../../models/Cart";
import Product from "../../../models/Product";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../../lib/mongodb";

const JWT_SECRET = "$secret123#";

export default async function handler(req, res) {
  if (req.method !== "POST") {
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
      console.error("Cart authentication error:", error.message);

      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    const userId = decoded.id;

    // ---------------------------------------
    // Validate request
    // ---------------------------------------
    const { productId, quantity, size } = req.body || {};

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    // ---------------------------------------
    // Database
    // ---------------------------------------
    await connectToDatabase();

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Product already exists
      cart.items[itemIndex].quantity += parsedQuantity;
      cart.items[itemIndex].size = size || cart.items[itemIndex].size;
    } else {
      // New product
      cart.items.push({
        product: productId,
        quantity: parsedQuantity,
        size: size || "",
        price: product.price,
      });
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

    return res.status(200).json({
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add cart API error:", error);

    return res.status(500).json({
      message: "Unable to add item to cart",
    });
  }
}