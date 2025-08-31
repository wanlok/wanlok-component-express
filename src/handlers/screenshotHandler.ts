import { Request, Response } from "express";
import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { browserOptions } from "../common/PuppeteerUtils";
import { crop16by9, toImages } from "../common/PDFUtils";
import { githubScreenshotDirectoryPath, screenshotDirectoryPath } from "../common/config";
import { randomUUID } from "crypto";
import { commit } from "../common/FileUtils";

puppeteer.use(StealthPlugin());

if (!fs.existsSync(screenshotDirectoryPath)) {
  fs.mkdirSync(screenshotDirectoryPath);
}

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
  const filePath: `${string}.png` = `${screenshotDirectoryPath}/${id}.png`;
  if (contentType === "application/pdf") {
    await toImages(
      response,
      (pageNumber) => (pageNumber === 1 ? filePath : undefined),
      (canvas) => crop16by9(canvas)
    );
  } else {
    await getPuppeteerScreenshot(url, () => filePath);
  }
  copyToGithub(id);
  res.json({ id, url });
};

const copyToGithub = async (id: string) => {
  try {
    const filePath = `${screenshotDirectoryPath}/${id}.png`;
    const newFilePath = `${githubScreenshotDirectoryPath}/${id}.png`;
    await fs.promises.copyFile(filePath, newFilePath);
    commit();
  } catch (e) {
    console.log(e);
  }
};
