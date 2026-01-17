import { connectToDatabase } from "../../lib/mongodb";
import BankAccount from "../../models/BankAccount";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const banks = await BankAccount.find({ userId });
    return res.status(200).json(banks);
  } else if (req.method === "POST") {
    const { userId, accountHolder, bankName, accountNumber, ifsc, isDefault } = req.body;
    if (!userId || !accountHolder || !bankName || !accountNumber || !ifsc) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (isDefault) {
      await BankAccount.updateMany({ userId }, { isDefault: false });
    }
    const bank = await BankAccount.create({ userId, accountHolder, bankName, accountNumber, ifsc, isDefault });
    return res.status(201).json(bank);
  } else if (req.method === "PUT") {
    const { _id, userId, accountHolder, bankName, accountNumber, ifsc, isDefault } = req.body;
    if (!_id || !userId) return res.status(400).json({ error: "_id and userId required" });
    if (isDefault) {
      await BankAccount.updateMany({ userId }, { isDefault: false });
    }
    const updateData = { accountHolder, bankName, accountNumber, ifsc, isDefault };
    const bank = await BankAccount.findByIdAndUpdate(_id, updateData, { new: true });
    return res.status(200).json(bank);
  } else if (req.method === "DELETE") {
    const { _id, userId } = req.body;
    if (!_id || !userId) return res.status(400).json({ error: "_id and userId required" });
    const bank = await BankAccount.findByIdAndDelete(_id);
    if (bank && bank.isDefault) {
      const another = await BankAccount.findOne({ userId });
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
