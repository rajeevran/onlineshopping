import { connectToDatabase } from "../../lib/mongodb";
import Address from "../../models/Address";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const condition ={}
    const { userId } = req.query;
    const isDefault = req.query.isDefault ;
    if (userId) {
      condition.userId = userId;
    }
    if (isDefault !== undefined) {
      condition.isDefault = isDefault;
    }

    if (!userId) return res.status(400).json({ error: "userId required" });
    const addresses = await Address.find(condition);
    return res.status(200).json(addresses);
  } else if (req.method === "POST") {
    const { userId, name, phone, street, city, state, pincode, isDefault } = req.body;
    if (!userId || !name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }
    const address = await Address.create({ userId, name, phone, street, city, state, pincode, isDefault });
    return res.status(201).json(address);
  } else if (req.method === "PUT") {
    // Edit or set default
    const { _id, userId, name, phone, street, city, state, pincode, isDefault } = req.body;
    if (!_id || !userId) return res.status(400).json({ error: "_id and userId required" });
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }
    const updateData = { name, phone, street, city, state, pincode, isDefault };
    const address = await Address.findByIdAndUpdate(_id, updateData, { new: true });
    return res.status(200).json(address);
  } else if (req.method === "DELETE") {
    // Delete address
    const { _id, userId } = req.body;
    if (!_id || !userId) return res.status(400).json({ error: "_id and userId required" });
    const address = await Address.findByIdAndDelete(_id);
    // If deleted address was default, set another as default
    if (address && address.isDefault) {
      const another = await Address.findOne({ userId });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }
    return res.status(200).json({ success: true });
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
