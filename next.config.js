/** @type {import('next').NextConfig} */
const nextConfig={
 reactStrictMode:true,
 images:{domains:["localhost","noadua.com","www.noadua.com"]},
 async rewrites(){return [{source:"/uploads/:path*",destination:"/api/uploads/:path*"}]},
};
module.exports=nextConfig;
