import crypto from "crypto";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../lib/mongodb";
import Order from "../../models/Order";
import Address from "../../models/Address";
import Product from "../../models/Product";
import BankAccount from "../../models/BankAccount";

const JWT_SECRET = "$secret123#";

function getDecodedUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const { userId } = req.query;
    const condition = userId ? { userId } : {};
    const orders = await Order.find(condition)
      .populate("products.productId")
      .populate("addressId")
      .populate("bankAccountId", "accountHolder bankName accountNumber ifsc");
    return res.status(200).json(orders);
  }

  if (req.method === "POST") {
    const decoded = getDecodedUser(req);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    try {
      const {
        products,
        totalAmount,
        addressId,
        orderId,
        paymentId,
        razorpaySignature,
        bankAccountId,
        paymentMethod = "Razorpay",
      } = req.body || {};

      if (!Array.isArray(products) || products.length === 0 || !totalAmount || !orderId || !paymentId || !razorpaySignature) {
        return res.status(400).json({ error: "Payment and order details are required." });
      }

      const address = await Address.findOne({ _id: addressId, userId: decoded.id });
      if (!address) {
        return res.status(400).json({ error: "Please select a valid delivery address." });
      }

      if (bankAccountId) {
        // Do not trust a bank account belonging to another user.
        const bank = await BankAccount.findOne({ _id: bankAccountId, userId: decoded.id });
        if (!bank) return res.status(400).json({ error: "Invalid saved bank account." });
      }

      // Verify Razorpay signature before marking the order as paid.
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const generatedBuffer = Buffer.from(generatedSignature);
      const receivedBuffer = Buffer.from(String(razorpaySignature));
      const validSignature =
        generatedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

      if (!validSignature) {
        return res.status(400).json({ error: "Payment verification failed." });
      }

      const productIds = products.map((item) => item.productId).filter(Boolean);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).select("_id price");
      const productMap = new Map(dbProducts.map((product) => [String(product._id), product]));

      let verifiedTotal = 0;
      const verifiedProducts = [];
      for (const item of products) {
        const product = productMap.get(String(item.productId));
        const quantity = Number(item.quantity || 0);
        if (!product || !Number.isInteger(quantity) || quantity < 1) {
          return res.status(400).json({ error: "One or more products are invalid." });
        }
        const price = Number(product.price || 0);
        verifiedTotal += price * quantity;
        verifiedProducts.push({
          productId: product._id,
          quantity,
          price,
          size: item.size || "",
        });
      }

      if (Math.round(Number(totalAmount) * 100) !== Math.round(verifiedTotal * 100)) {
        return res.status(400).json({ error: "Order amount verification failed." });
      }

      const order = await Order.create({
        userId: decoded.id,
        products: verifiedProducts,
        totalAmount: verifiedTotal,
        addressId,
        bankAccountId: bankAccountId || null,
        paymentMethod,
        orderId,
        paymentId,
        paymentStatus: "Paid",
      });

      return res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      return res.status(500).json({ error: "Unable to create order." });
    }
  }

  if (req.method === "PUT") {
    const { _id, orderStatus } = req.body;
    if (!_id || !orderStatus) return res.status(400).json({ error: "_id and orderStatus required" });
    const order = await Order.findByIdAndUpdate(_id, { orderStatus }, { new: true });
    return res.status(200).json(order);
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
