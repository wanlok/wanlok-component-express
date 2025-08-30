import { Request, Response } from "express";
import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { browserOptions } from "./common/PuppeteerUtils";
import { screenshotDirectory } from "./common/config";
import { randomUUID } from "crypto";
import path from "path";

puppeteer.use(StealthPlugin());

export const screenshot = async (req: Request, res: Response) => {
  let id: string | undefined = undefined;
  let screenshot: Uint8Array<ArrayBufferLike> | undefined = undefined;
  const url = req.query.url as string;
  const view = req.query.view as string;
  const browser = await puppeteer.launch(browserOptions);
  if (url && url.length > 0) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.setViewport({ width: 1280, height: 720 });
    if (!fs.existsSync(screenshotDirectory)) {
      fs.mkdirSync(screenshotDirectory);
    }
    id = randomUUID();
    const filePath = path.join(screenshotDirectory, id);
    if (view === "true") {
      screenshot = await page.screenshot();
    } else {
      await page.screenshot({ path: `${filePath}.png` });
    }
  }
  await browser.close();
  if (view === "true") {
    res.set("Content-Type", "image/png");
    res.send(screenshot);
  } else {
    res.json({ id, url });
  }
};
