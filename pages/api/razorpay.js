import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../lib/mongodb";
import Product from "../../models/Product";

const JWT_SECRET = "$secret123#";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    await connectToDatabase();

    const { items = [] } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Checkout items are required." });
    }

    const productIds = items.map((item) => item.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select("_id price name");
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    let total = 0;
    for (const item of items) {
      const product = productMap.get(String(item.productId));
      const quantity = Number(item.quantity || 0);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "One or more checkout items are invalid." });
      }
      total += Number(product.price || 0) * quantity;
    }

    if (total <= 0) return res.status(400).json({ message: "Order total must be greater than zero." });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `noadua_${Date.now()}`,
    });

    return res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      total,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ message: "Error creating payment order." });
  }
}
