import { connectToDatabase } from "../../../lib/mongodb";
import FestiveWave from "../../../models/FestiveWave";
import mongoose from "mongoose";
import { cleanupUnusedImages } from "../../../lib/imageStorage";

export default async function handler(req, res) {
  await connectToDatabase();
  const { id } = req.query;

  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid record ID" });

  if (req.method === "OPTIONS") { res.setHeader("Allow", ["GET", "PUT", "DELETE", "OPTIONS"]); return res.status(204).end(); }

  if (req.method === "GET") {
    const product = await FestiveWave.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  }

  if (req.method === "PUT") {
    const current = await FestiveWave.findById(id);
    if (!current) return res.status(404).json({message:"Record not found"});
    const oldImages = Array.isArray(current.images) ? [...current.images] : [];
    try{const body=req.body||{};const payload={};if(body.title!==undefined)payload.title=String(body.title||"").trim();if(body.active!==undefined)payload.active=body.active===true||String(body.active)==="true";if(Array.isArray(body.images))payload.images=body.images.filter(Boolean).map(String);if(body.userId)payload.userId=String(body.userId).trim();else if(body.userId===null)payload.userId=null;if(body.productId!==undefined){const ids=Array.isArray(body.productId)?body.productId.map(String).map(x=>x.trim()).filter(Boolean):String(body.productId||"").split(",").map(x=>x.trim()).filter(Boolean);payload.productId=[...new Set(ids)];}
const updated=await FestiveWave.findByIdAndUpdate(id,payload,{new:true,runValidators:true});if(!updated)return res.status(404).json({message:"Record not found"});if (Array.isArray((req.body || {}).images)) await cleanupUnusedImages(oldImages);return res.status(200).json(updated);}catch(err){return res.status(400).json({message:err.message||"Unable to update record"});}
  }

  if (req.method === "DELETE") {
    const current = await FestiveWave.findById(id);
    if (!current) return res.status(404).json({ message: "Record not found" });
    const oldImages = Array.isArray(current.images) ? [...current.images] : [];
    await FestiveWave.findByIdAndDelete(id);
    await cleanupUnusedImages(oldImages);
    return res.status(200).json({ message: "Product deleted" });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE", "OPTIONS"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
