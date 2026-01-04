
import { connectToDatabase } from "../../../lib/mongodb";
import Cart from "../../../models/Cart";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await connectToDatabase();


  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, '$secret123#');

    const cart = await Cart.findOne({ user: decoded.id })
      .populate("items.product");

    res.status(200).json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
