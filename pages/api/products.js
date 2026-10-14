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
        newArrival: body.newArrival === true || String(body.newArrival) === "true",
        onSale: body.onSale === true || String(body.onSale) === "true",
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
    try {
      const { category = "", search = "", sort = "featured" } = req.query;
      const normalizedCategory = String(category).toLowerCase().trim();
      const normalizedSearch = String(search).trim();
      const condition = {};

      if (normalizedSearch) {
        const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escaped, "i");
        condition.$or = [
          { name: searchRegex }, { description: searchRegex },
          { category: searchRegex }, { tags: searchRegex },
        ];
      }
      if (normalizedCategory === "new-in") {
        condition.newArrival = true;
      } else if (["dresses", "suits", "collections"].includes(normalizedCategory)) {
        const keyword = normalizedCategory === "dresses" ? "dress" : normalizedCategory === "suits" ? "suit" : "collection";
        const categoryRegex = new RegExp(keyword, "i");
        condition.$and = [...(condition.$and || []), { $or: [{ category: categoryRegex }, { tags: categoryRegex }] }];
      } else if (normalizedCategory === "sale") {
        condition.$and = [...(condition.$and || []), { $or: [{ onSale: true }, { discountPrice: { $gt: 0 } }, { tags: /sale|discount/i }] }];
      }
      const sortOptions = {
        featured: { featured: -1, createdAt: -1 }, newest: { createdAt: -1 },
        "price-asc": { price: 1 }, "price-desc": { price: -1 }, name: { name: 1 },
      };
      const selectedSort = normalizedCategory === "new-in" ? { newArrival: -1, createdAt: -1 } : (sortOptions[String(sort)] || sortOptions.featured);
      const products = await Product.find(condition).sort(selectedSort).limit(200).lean();
      return res.status(200).json(products);
    } catch (err) {
      console.error("Product fetch error:", err);
      return res.status(500).json({ message: "Unable to fetch products" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
