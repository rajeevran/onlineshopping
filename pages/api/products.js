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
        tags: fields.tags ? fields.tags[0].split(",").map((t) => t.trim()) : [],
        images: imagePaths,
      };

      const newProduct = await Product.create(productData);
      return res.status(201).json(newProduct);
    });
  } else if (req.method === "GET") {
    const products = await Product.find();
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
