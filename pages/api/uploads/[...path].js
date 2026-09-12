import fs from "fs";
import path from "path";
const MIME={".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",".gif":"image/gif",".svg":"image/svg+xml"};
export default async function handler(req,res){
  if(req.method!=="GET"&&req.method!=="HEAD"){res.setHeader("Allow",["GET","HEAD"]);return res.status(405).end();}
  const parts=Array.isArray(req.query.path)?req.query.path:[req.query.path];
  const clean=parts.filter(Boolean).map(String);
  if(!clean.length||clean.some(x=>x==="."||x===".."||x.includes("\0")))return res.status(400).json({message:"Invalid image path"});
  const root=path.resolve(process.cwd(),"public","uploads");
  const file=path.resolve(root,...clean);
  if(!file.startsWith(root+path.sep))return res.status(400).json({message:"Invalid image path"});
  try{
    const stat=await fs.promises.stat(file);
    if(!stat.isFile())return res.status(404).end();
    res.setHeader("Content-Type",MIME[path.extname(file).toLowerCase()]||"application/octet-stream");
    res.setHeader("Content-Length",String(stat.size));
    res.setHeader("Cache-Control","public, max-age=31536000, immutable");
    if(req.method==="HEAD")return res.status(200).end();
    res.status(200); fs.createReadStream(file).pipe(res);
  }catch{return res.status(404).end();}
}
