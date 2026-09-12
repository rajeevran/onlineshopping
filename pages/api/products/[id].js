import { connectToDatabase } from "../../../lib/mongodb";
import Product from "../../../models/Product";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await connectToDatabase();
  const { id } = req.query;

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "PUT", "DELETE", "OPTIONS"]);
    return res.status(204).end();
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  if (req.method === "GET") {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  }

  if (req.method === "PUT") {
    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await Product.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product deleted" });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
