import { Request, Response } from "express";
import puppeteer, { Browser, LaunchOptions, Page, PDFOptions } from "puppeteer";
import { chromeExecutablePath } from "./config";

const browserOptions: LaunchOptions = {
  executablePath: chromeExecutablePath,
  headless: true
};

const pdfOptions: PDFOptions = {
  format: "A4",
  printBackground: true
  // margin: { top: "16px", bottom: "16px" }
};

const getPage = async (browser: Browser, url: string) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const element: HTMLElement | null = document.getElementById("root");
    return element && element.innerText.trim().length > 0;
  });
  return page;
};

export const pdf = async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const id = req.query.id as string;
  let page: Page | undefined = undefined;
  const browser = await puppeteer.launch(browserOptions);
  if (url) {
    page = await getPage(browser, url);
  }
  if (id) {
    page = await getPage(browser, `https://wanlok2025.github.io/?id=${id}`);
  }
  if (page) {
    const pdf = await page.pdf(pdfOptions);
    await browser.close();
    res.set("Content-Type", "application/pdf");
    res.send(pdf);
  }
};
