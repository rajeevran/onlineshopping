import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  await connectToDatabase();
  const {
    query: { id },
    method,
    body
  } = req;

  if (method === "PUT") {
    const updateData = {};
    const { firstName, lastName, email, dob, phone, gender, role, passwordHash } = body;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (dob) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (role && ["user", "admin"].includes(role)) updateData.role = role;
    if (passwordHash) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(passwordHash, salt);
    }
    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } else if (method === "DELETE") {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ message: "User deleted" });
  } else if (method === "GET") {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
