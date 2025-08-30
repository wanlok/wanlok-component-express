import { Request, Response } from "express";
import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { browserOptions } from "../common/PuppeteerUtils";
import { crop16by9, toImages } from "../common/PDFUtils";
import { screenshotDirectory } from "../common/config";
import { randomUUID } from "crypto";

puppeteer.use(StealthPlugin());

const getPuppeteerScreenshot = async (url: string, getImageFilePath: () => `${string}.png`) => {
  if (url.length > 0) {
    const browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: getImageFilePath() });
    await browser.close();
  }
};

export const screenshot = async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const response = await fetch(url);
  const contentType = response.headers.get("content-type");
  const id = randomUUID();
  const filePath: `${string}.png` = `${screenshotDirectory}/${id}.png`;
  if (!fs.existsSync(screenshotDirectory)) {
    fs.mkdirSync(screenshotDirectory);
  }
  if (contentType === "application/pdf") {
    await toImages(
      response,
      (pageNumber) => (pageNumber === 1 ? filePath : undefined),
      (canvas) => crop16by9(canvas)
    );
  } else {
    await getPuppeteerScreenshot(url, () => filePath);
  }
  res.json({ id, url });
};
