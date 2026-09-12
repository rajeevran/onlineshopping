import { connectToDatabase } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { cleanupUnusedImages } from "../../../../lib/imageStorage";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 850 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });

function parseIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : -1;
}

function uploadedPath(file) {
  return "/api/uploads/" + path.basename(file.filepath);
}


export default async function handler(req, res) {
  await connectToDatabase();
  const { id } = req.query;

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
    return res.status(204).end();
  }

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (req.method === "POST") {
    const form = formidable({
      multiples: true,
      uploadDir,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: 10,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(413).json({ message: "Image is too large. Please use an image under 850 KB." });

      const uploaded = files.images
        ? (Array.isArray(files.images) ? files.images : [files.images])
        : [];

      if (!uploaded.length) return res.status(400).json({ message: "No images selected" });
      if ((product.images || []).length + uploaded.length > 10) {
        return res.status(400).json({ message: "A product can have a maximum of 10 images" });
      }

      const newPaths = uploaded.map(uploadedPath);
      product.images = [...(product.images || []), ...newPaths];
      await product.save();
      return res.status(200).json({ images: product.images });
    });
    return;
  }

  if (req.method === "PUT") {
    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: 1,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(413).json({ message: "Image is too large. Please use an image under 850 KB." });

      const index = parseIndex(fields.index?.[0] ?? fields.index);
      const file = Array.isArray(files.image) ? files.image[0] : files.image;

      if (index < 0 || index >= (product.images || []).length) {
        if (file?.filepath) await cleanupUnusedImages([uploadedPath(file)]);
        return res.status(400).json({ message: "Invalid image index" });
      }
      if (!file) return res.status(400).json({ message: "Replacement image is required" });

      const oldImage = product.images[index];
      product.images[index] = uploadedPath(file);
      await product.save();
      await cleanupUnusedImages([oldImage]);

      return res.status(200).json({ images: product.images });
    });
    return;
  }

  if (req.method === "PATCH") {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", async () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const primaryIndex = parseIndex(body.primaryIndex);
        const currentImages = product.images || [];

        if (primaryIndex < 0 || primaryIndex >= currentImages.length) {
          return res.status(400).json({ message: "Invalid primary image index" });
        }

        if (primaryIndex !== 0) {
          const primary = currentImages[primaryIndex];
          product.images = [primary, ...currentImages.filter((_, index) => index !== primaryIndex)];
          await product.save();
        }

        return res.status(200).json({ images: product.images });
      } catch (e) {
        return res.status(400).json({ message: "Invalid request body" });
      }
    });
    return;
  }

  if (req.method === "DELETE") {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", async () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const index = parseIndex(body.index);
        if (index < 0 || index >= (product.images || []).length) {
          return res.status(400).json({ message: "Invalid image index" });
        }

        const removed = product.images[index];
        product.images.splice(index, 1);
        await product.save();
        await cleanupUnusedImages([removed]);
        return res.status(200).json({ images: product.images });
      } catch (e) {
        return res.status(400).json({ message: "Invalid request body" });
      }
    });
    return;
  }

  res.setHeader("Allow", ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
