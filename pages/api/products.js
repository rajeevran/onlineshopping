import { connectToDatabase } from "../../lib/mongodb";
import Product from "../../models/Product";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(204).end();
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const data = {
        name: String(body.name || "").trim(),
        price: Number(body.price) || 0,
        category: String(body.category || "").trim(),
        description: String(body.description || ""),
        tags: Array.isArray(body.tags) ? body.tags.filter(Boolean).map(String) : String(body.tags || "").split(",").map(x => x.trim()).filter(Boolean),
        care: Array.isArray(body.care) ? body.care.filter(Boolean).map(String) : String(body.care || "").split(",").map(x => x.trim()).filter(Boolean),
        colors: Array.isArray(body.colors) ? body.colors.filter(Boolean).map(String) : String(body.colors || "").split(",").map(x => x.trim()).filter(Boolean),
        sizes: Array.isArray(body.sizes) ? body.sizes.filter(Boolean).map(String) : String(body.sizes || "").split(",").map(x => x.trim()).filter(Boolean),
        images: Array.isArray(body.images) ? body.images.filter(Boolean).map(String) : [],
        discountPrice: body.discountPrice === "" || body.discountPrice === null || body.discountPrice === undefined ? undefined : Number(body.discountPrice),
        inStock: body.inStock === undefined ? true : (body.inStock === true || String(body.inStock) === "true"),
        featured: body.featured === true || String(body.featured) === "true",
      };
      if (!data.name) return res.status(400).json({ message: "Product name is required" });
      const created = await Product.create(data);
      return res.status(201).json(created);
    } catch (err) {
      console.error("Product create error:", err);
      return res.status(400).json({ message: err.message || "Unable to create product" });
    }
  }

  if (req.method === "GET") {
    const condition = req.query.category ? { category: req.query.category } : {};
    const products = await Product.find(condition);
    return res.status(200).json(products);
  }

  res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
