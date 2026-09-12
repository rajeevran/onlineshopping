import { connectToDatabase } from "../../lib/mongodb";
import HomeProduct from "../../models/HomeProduct";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(204).end();
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const data = {
      title: String(body.title || "").trim(),
      productId: String(body.productId || "").trim(),
      active: body.active === undefined ? true : (body.active === true || String(body.active) === "true"),
      images: Array.isArray(body.images) ? body.images.filter(Boolean).map(String) : [],
    };
    if (body.userId) data.userId = String(body.userId).trim();
    try {
      const created = await HomeProduct.create(data);
      return res.status(201).json(created);
    } catch (err) {
      return res.status(400).json({ message: err.message || "Unable to create record" });
    }
  } else if (req.method === "GET") {
    const products = await HomeProduct.find().populate("productId", "name price images");
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
