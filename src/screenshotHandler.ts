import { Request, Response } from "express";
import fs from "fs";
import puppeteer from "puppeteer";
import { browserOptions } from "./common/PuppeteerUtils";
import { screenshotDirectory } from "./common/config";
import path from "path";
import { randomUUID } from "crypto";

export const saveScreenshot = async (req: Request, res: Response) => {
  let id: string | undefined = undefined;
  const url = req.query.url as string;
  const browser = await puppeteer.launch(browserOptions);
  if (url && url.length > 0) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.setViewport({ width: 1280, height: 720 });
    if (!fs.existsSync(screenshotDirectory)) {
      fs.mkdirSync(screenshotDirectory);
    }
    id = randomUUID();
    await page.screenshot({ path: `${path.join(screenshotDirectory, id)}.png` });
  }
  await browser.close();
  res.json({ id, url });
};
