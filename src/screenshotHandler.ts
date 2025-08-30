import { Request, Response } from "express";
import puppeteer from "puppeteer";
import { browserOptions } from "./common/PuppeteerUtils";

export const takeScreenshot = async (req: Request, res: Response) => {
  const url = req.query.url as string;
  let screenshot: Uint8Array<ArrayBufferLike> | undefined = undefined;
  const browser = await puppeteer.launch(browserOptions);
  if (url && url.length > 0) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.setViewport({ width: 1280, height: 720 });
    screenshot = await page.screenshot();
  }
  await browser.close();
  res.set("Content-Type", "image/png");
  res.send(screenshot);
};
