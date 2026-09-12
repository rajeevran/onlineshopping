import { connectToDatabase } from "../../lib/mongodb";
import Product from "../../models/Product";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
    return res.status(204).end();
  }

  await connectToDatabase();

  if (req.method === "POST") {
    const form = formidable({
      multiples: true,
      uploadDir: path.join(process.cwd(), "/public/uploads"),
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        return res.status(500).json({ error: "Error parsing form data" });
      }

      // Handle multiple image uploads
      let imagePaths = [];
      if (files.images) {
        if (Array.isArray(files.images)) {
          imagePaths = files.images.map((file) =>
            "/uploads/" + path.basename(file.filepath)
          );
        } else {
          imagePaths = ["/uploads/" + path.basename(files.images.filepath)];
        }
      }

      const productData = {
        name: fields.name?.[0] || "",
        price: Number(fields.price?.[0]) || 0,
        category: fields.category?.[0] || "",
        description: fields.description?.[0] || "",
        tags: fields.tags ? fields.tags[0].split(",").map((t) => t.trim()).filter(Boolean) : [],
        care: fields.care ? fields.care[0].split(",").map((t) => t.trim()).filter(Boolean) : [],
        colors: fields.colors ? fields.colors[0].split(",").map((t) => t.trim()).filter(Boolean) : [],
        sizes: fields.sizes ? fields.sizes[0].split(",").map((t) => t.trim()).filter(Boolean) : [],
        images: imagePaths,
        discountPrice: fields.discountPrice?.[0] ? Number(fields.discountPrice[0]) : undefined,
        inStock: fields.inStock?.[0] === undefined ? true : String(fields.inStock[0]) !== "false",
        featured: String(fields.featured?.[0] || "false") === "true",
      };

      const rawPrimaryIndex = Number(fields.primaryImageIndex?.[0]);
      const primaryIndex = Number.isInteger(rawPrimaryIndex) && rawPrimaryIndex >= 0 && rawPrimaryIndex < imagePaths.length
        ? rawPrimaryIndex
        : 0;
      if (imagePaths.length > 1 && primaryIndex !== 0) {
        productData.images = [imagePaths[primaryIndex], ...imagePaths.filter((_, i) => i !== primaryIndex)];
      }

      const newProduct = await Product.create(productData);
      return res.status(201).json(newProduct);
    });
  } else if (req.method === "GET") {
    console.log('requuuu',req.query);
    let condition ={}
    if(req.query.category){
      condition = {category:req.query.category}
    }
    const products = await Product.find(condition);
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
