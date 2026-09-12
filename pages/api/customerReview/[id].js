import { connectToDatabase } from "../../../lib/mongodb";
import Review from "../../../models/Review";
import mongoose from "mongoose";
import { cleanupUnusedImages } from "../../../lib/imageStorage";

export default async function handler(req, res) {
  await connectToDatabase();
  const { id } = req.query;

  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid record ID" });

  if (req.method === "OPTIONS") { res.setHeader("Allow", ["GET", "PUT", "DELETE", "OPTIONS"]); return res.status(204).end(); }

  if (req.method === "GET") {
    const product = await Review.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  }

  if (req.method === "PUT") {
    const current = await Review.findById(id);
    if (!current) return res.status(404).json({message:"Record not found"});
    const oldImages = Array.isArray(current.images) ? [...current.images] : [];
    try{const body=req.body||{};const payload={};if(body.productId!==undefined)payload.productId=String(body.productId||"").trim();if(body.userId)payload.userId=String(body.userId).trim();else if(body.userId===null)payload.userId=null;if(body.comment!==undefined)payload.comment=String(body.comment);if(body.rating!==undefined)payload.rating=Number(body.rating);if(body.active!==undefined)payload.active=body.active===true||String(body.active)==="true";if(Array.isArray(body.images))payload.images=body.images.filter(Boolean).map(String);const updated=await Review.findByIdAndUpdate(id,payload,{new:true,runValidators:true});if(!updated)return res.status(404).json({message:"Review not found"});if (Array.isArray((req.body || {}).images)) await cleanupUnusedImages(oldImages);return res.status(200).json(updated);}catch(err){return res.status(400).json({message:err.message||"Unable to update review"});}
  }

  if (req.method === "DELETE") {
    const current = await Review.findById(id);
    if (!current) return res.status(404).json({ message: "Record not found" });
    const oldImages = Array.isArray(current.images) ? [...current.images] : [];
    await Review.findByIdAndDelete(id);
    await cleanupUnusedImages(oldImages);
    return res.status(200).json({ message: "Product deleted" });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE", "OPTIONS"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
