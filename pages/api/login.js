import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  await connectToDatabase();

 if (req.method === "POST") {
    try {
      await connectToDatabase();
      console.log("req.body--------------",req.body);
      
      const { email, passwordHash } = req.body;
  
      if (!email || !passwordHash) {
        return res.status(400).json({ message: "Email and password are required" });
      }
  
      const user = await User.findOne({ email });
      console.log('user',user);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credential" });

      }
  
      const isMatch = await bcrypt.compare(passwordHash, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credential" });

      }
  
     const token =  jwt.sign({
                  id: user._id,
                  email:user.email,
                  name:user.name
                }, 
                "$secret123#",
                { expiresIn: '1d' }
              );
  
      const userloginres ={
        message: "Login successful",
        token
      }
        return res.status(200).json(userloginres);

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong",error:error });

    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
