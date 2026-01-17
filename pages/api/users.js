import { connectToDatabase } from "../../lib/mongodb";
import User from "../../models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    let condition ={}
    if(req.query._id){
      condition = {_id:req.query._id}
    }
    const users = await User.find(condition);
    return res.status(200).json(users);
  } else if (req.method === "POST") {
    const { firstName, lastName, email, passwordHash } = req.body;

    if (!firstName || !lastName || !email || !passwordHash) {
      return res.status(409).end(`All fields are required`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).end(`User already exists`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordHash, salt);

    // Create user
    const user = await User.create({
      ...req.body,
      passwordHash: hashedPassword
    });

    return res.status(201).json(user);
  } else if (req.method === "PUT") {
    const { _id, firstName, lastName, email,dob,phone, passwordHash } = req.body;
    const updateData = { };

    if (!_id) {
      return res.status(409).end(`id required`);
    }
     if (firstName) {
      updateData.firstName = firstName;
    }
     if (lastName) {
      updateData.lastName = lastName;
    }
     if (email) {
      updateData.email = email;
    }
    if (phone) {
      updateData.phone = phone;
    }
    if (dob) {
      updateData.dob = dob;
    }
    if (passwordHash) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordHash, salt);
      updateData.passwordHash = hashedPassword;
    }
    const user = await User.findByIdAndUpdate(_id, updateData, { new: true });
    return res.status(200).json(user);
  }else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
