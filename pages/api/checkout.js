import { connectToDatabase } from "../../lib/mongodb";
import Address from "../../models/Address";
import BankAccount from "../../models/BankAccount";
import User from "../../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = "$secret123#";

function getToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function authenticate(req) {
  const token = getToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  await connectToDatabase();

  const decoded = authenticate(req);
  if (!decoded?.id) {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }

  const userId = decoded.id;

  try {
    if (req.method === "GET") {
      const [user, addresses, banks] = await Promise.all([
        User.findById(userId).select("firstName lastName email phone"),
        Address.find({ userId }).sort({ isDefault: -1, updatedAt: -1 }),
        BankAccount.find({ userId })
          .select("accountHolder bankName accountNumber ifsc isDefault createdAt")
          .sort({ isDefault: -1, updatedAt: -1 }),
      ]);

      return res.status(200).json({
        user,
        addresses,
        banks,
        defaultAddress: addresses.find((address) => address.isDefault) || addresses[0] || null,
        defaultBank: banks.find((bank) => bank.isDefault) || banks[0] || null,
      });
    }

    if (req.method === "POST") {
      const { name, phone, street, city, state, pincode, isDefault } = req.body || {};

      if (!name || !phone || !street || !city || !state || !pincode) {
        return res.status(400).json({ message: "All address fields are required." });
      }

      if (isDefault) {
        await Address.updateMany({ userId }, { $set: { isDefault: false } });
      }

      const address = await Address.create({
        userId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        street: String(street).trim(),
        city: String(city).trim(),
        state: String(state).trim(),
        pincode: String(pincode).trim(),
        isDefault: Boolean(isDefault),
      });

      return res.status(201).json(address);
    }

    if (req.method === "PUT") {
      const { _id, name, phone, street, city, state, pincode, isDefault } = req.body || {};

      if (!_id || !name || !phone || !street || !city || !state || !pincode) {
        return res.status(400).json({ message: "Address details are incomplete." });
      }

      const existing = await Address.findOne({ _id, userId });
      if (!existing) {
        return res.status(404).json({ message: "Address not found." });
      }

      if (isDefault) {
        await Address.updateMany(
          { userId, _id: { $ne: _id } },
          { $set: { isDefault: false } }
        );
      }

      const address = await Address.findOneAndUpdate(
        { _id, userId },
        {
          name: String(name).trim(),
          phone: String(phone).trim(),
          street: String(street).trim(),
          city: String(city).trim(),
          state: String(state).trim(),
          pincode: String(pincode).trim(),
          isDefault: Boolean(isDefault),
        },
        { new: true }
      );

      return res.status(200).json(address);
    }

    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Checkout API error:", error);
    return res.status(500).json({ message: "Unable to load checkout information." });
  }
}
