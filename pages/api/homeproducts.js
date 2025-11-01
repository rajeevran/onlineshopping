import { connectToDatabase } from "../../lib/mongodb";
import HomeProduct from "../../models/HomeProduct";
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
      uploadDir: path.join(process.cwd(), "/public/uploads/home"),
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
            "/uploads/home/" + path.basename(file.filepath)
          );
        } else {
          imagePaths = ["/uploads/home/" + path.basename(files.images.filepath)];
        }
      }

      const productData = {
        title: fields.title?.[0] || "",
        productId: fields.productId?.[0] || "",
        active: Boolean(fields.active?.[0]) || true,
        images: imagePaths,
      };
      try{
      const newProduct = await HomeProduct.create(productData);
      return res.status(201).json(newProduct);
      }catch(err){
      return res.status(500).json(err);
      }
    });
  } else if (req.method === "GET") {
    const products = await HomeProduct.find();
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
