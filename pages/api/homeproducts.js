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

      // Support both newly uploaded files and selected catalogue image URLs.
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
      if (!imagePaths.length && fields.images) {
        const raw = Array.isArray(fields.images) ? fields.images[0] : fields.images;
        try {
          const parsed = JSON.parse(String(raw));
          imagePaths = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          imagePaths = String(raw).split(",").map(x => x.trim()).filter(Boolean);
        }
      }

      const productData = {
        title: fields.title?.[0] || "",
        productId: fields.productId?.[0] || "",
        active: fields.active?.[0] === undefined ? true : String(fields.active[0]) === "true",
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
    const products = await HomeProduct.find().populate("productId", "name price images");
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
