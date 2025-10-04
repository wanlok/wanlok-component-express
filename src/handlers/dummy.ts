import { Request, Response } from "express";
import { JSDOM } from "jsdom";

export const dummy = async (req: Request, res: Response) => {
  const url = req.query.url;

  if (typeof url === "string") {
    const response = await fetch(url);
    const html = await response.text();
    const document = new JSDOM(html).window.document;
    document.getElementById("comic_chapter");

    console.log(document);
  }

  res.json({ status: "OK", url: req.query.url });
};
