import { connectToDatabase } from "../../lib/mongodb";
import ExploreCollection from "../../models/ExploreCollection";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable Next.js body parser for file uploads
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
import User from "../../models/User";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "POST") {
    
      const productData = {
        title: req.body.title || "",
        productId: req.body.productId || [],
        userId: req.body.userId || "",
        active: Boolean(req.body.active) || true,
      };
      try{
      const newProduct = await ExploreCollection.create(productData);
      return res.status(201).json(newProduct);
      }catch(err){
      return res.status(500).json(err);
      }
    
  } else if (req.method === "GET") {
    const products = await ExploreCollection.find()
    .populate("userId", "name email")
    .populate("productId", "name price images");
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
