import { connectToDatabase } from "../../lib/mongodb";
import Review from "../../models/Review";
import User from "../../models/User";
export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "OPTIONS") { res.setHeader("Allow", ["GET", "POST", "OPTIONS"]); return res.status(204).end(); }

  if (req.method === "POST") {
    const body=req.body||{}; const data={productId:String(body.productId||"").trim(),comment:String(body.comment||""),rating:Number(body.rating||0),active:body.active===undefined?true:(body.active===true||String(body.active)==="true"),images:Array.isArray(body.images)?body.images.filter(Boolean).map(String):[]};
    if(body.userId)data.userId=String(body.userId).trim();
    try{const created=await Review.create(data);return res.status(201).json(created);}catch(err){return res.status(400).json({message:err.message||"Unable to create review"});}
  } else if (req.method === "GET") {
    const products = await Review.find()
    .populate("userId", "name email")
    .populate("productId", "name price images");
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
