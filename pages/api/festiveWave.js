import { connectToDatabase } from "../../lib/mongodb";
import FestiveWave from "../../models/FestiveWave";
import User from "../../models/User";

// Disable Next.js body parser for file uploads
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "OPTIONS") { res.setHeader("Allow", ["GET", "POST", "OPTIONS"]); return res.status(204).end(); }

  if (req.method === "POST") {
    const body=req.body||{}; const ids=Array.isArray(body.productId)?body.productId.map(String).map(x=>x.trim()).filter(Boolean):String(body.productId||"").split(",").map(x=>x.trim()).filter(Boolean);
    const data={title:String(body.title||"").trim(),productId:[...new Set(ids)],active:body.active===undefined?true:(body.active===true||String(body.active)==="true"),images:Array.isArray(body.images)?body.images.filter(Boolean).map(String):[]};
    if(body.userId)data.userId=String(body.userId).trim();
    try{const created=await FestiveWave.create(data);return res.status(201).json(created);}catch(err){return res.status(400).json({message:err.message||"Unable to create record"});}
  } else if (req.method === "GET") {
    const products = await FestiveWave.find()
    .populate("userId", "name email")
    .populate("productId", "name price images");
    return res.status(200).json(products);
  } else {
    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
