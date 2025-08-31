import { Request, Response } from "express";

export const health = async (req: Request, res: Response) => {
  res.json({ status: "OK" });
};
