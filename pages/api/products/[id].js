import { connectToDatabase } from "../../../lib/mongodb";
import Product from "../../../models/Product";
import mongoose from "mongoose";
import { cleanupUnusedImages } from "../../../lib/imageStorage";

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
    const current = await Product.findById(id);
    if (!current) return res.status(404).json({ message: "Product not found" });

    const oldImages = Array.isArray(current.images) ? [...current.images] : [];
    const body = req.body || {};
    const updated = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });

    // If an image was removed through an edit, remove its physical file too,
    // unless another product/content module still references that same file.
    if (Array.isArray(body.images)) await cleanupUnusedImages(oldImages);

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    const current = await Product.findById(id);
    if (!current) return res.status(404).json({ message: "Product not found" });
    const oldImages = Array.isArray(current.images) ? [...current.images] : [];
    await Product.findByIdAndDelete(id);
    await cleanupUnusedImages(oldImages);
    return res.status(200).json({ message: "Product deleted" });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
