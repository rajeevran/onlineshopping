import mongoose from "mongoose";
import { connectToDatabase } from "../../lib/mongodb";
import FestiveWave from "../../models/FestiveWave";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import User from "../../models/User";

// Disable Next.js body parser for file uploads
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
    return res.status(204).end();
  }

  await connectToDatabase();

  if (req.method === "POST") {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const productData = {
        title: body.title || "",
        productId: Array.isArray(body.productId) ? body.productId.filter(Boolean) : (body.productId || []),
        ...(body.userId ? { userId: String(body.userId).trim() } : {}),
        active: body.active === undefined ? true : (body.active === true || String(body.active) === "true"),
        images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      };

      const ids = Array.isArray(productData.productId) ? productData.productId : (productData.productId ? [productData.productId] : []);
      if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) return res.status(400).json({ message: "Invalid product ID" });
      if (productData.userId && !mongoose.Types.ObjectId.isValid(productData.userId)) return res.status(400).json({ message: "Invalid user ID" });

      const newProduct = await FestiveWave.create(productData);
      return res.status(201).json(newProduct);
    } catch (err) {
      console.error("[festiveWave API]", err);
      return res.status(500).json({ message: err?.message || "Internal server error" });
    }
  } else if (req.method === "GET") {
    const products = await FestiveWave.find()
    .populate("userId", "name email")
    .populate("productId", "name price images");
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
