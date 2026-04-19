import { Request, Response } from "express";

export const sendPhoneMessageHandler = async (req: Request, res: Response) => {
  const { userId, phoneNumber, otpCode } = req.body;

  console.log(userId, phoneNumber, otpCode);

  res.json({ status: "ok" });
};
