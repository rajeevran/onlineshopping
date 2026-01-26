import { connectToDatabase } from "../../lib/mongodb";
import Order from "../../models/Order";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const { userId } = req.query;
    const condition = userId ? { userId } : {};
    const orders = await Order.find(condition).populate("products.productId").populate("addressId");
    return res.status(200).json(orders);
  } else if (req.method === "POST") {
    let { userId, products, totalAmount, addressId, orderId, paymentId } = req.body;

    // try to extract userId from Authorization token if not provided
    try {
      if (!userId) {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
          const decoded = jwt.verify(token, "$secret123#");
          userId = decoded?.id || userId;
        }
      }
    } catch (err) {
      console.warn("Failed to decode token", err.message);
    }

    if (!userId || !products || !totalAmount) {
      return res.status(400).json({ error: "userId, products and totalAmount are required" });
    }

    // If products is an array of IDs, wrap them
    if (Array.isArray(products) && typeof products[0] === "string") {
      products = products.map((pid) => ({ productId: pid, quantity: 1, price: Number(totalAmount) }));
    }

    // If totalAmount is string, convert
    if (typeof totalAmount === "string") totalAmount = Number(totalAmount);

    // allow missing addressId (set to null)
    addressId = addressId || null;

    const order = await Order.create({ userId, products, totalAmount, addressId, orderId, paymentId });
    return res.status(201).json(order);
  } else if (req.method === "PUT") {
    const { _id, orderStatus } = req.body;
    if (!_id || !orderStatus) return res.status(400).json({ error: "_id and orderStatus required" });
    const order = await Order.findByIdAndUpdate(_id, { orderStatus }, { new: true });
    return res.status(200).json(order);
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
