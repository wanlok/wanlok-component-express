import { Request, Response } from "express";
import { chromium, Page } from "playwright";
import { chromeExecutablePath, screenshotDirectoryPath, vuforiaUsername, vuforiaPassword } from "../utils/config";

const login = async (page: Page) => {
  const url = "https://developer.vuforia.com/auth/login";
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#onetrust-accept-btn-handler").click();
  await page.waitForTimeout(1000);
  await page.locator("#login_email").pressSequentially(vuforiaUsername, { delay: 100 });
  await page.waitForTimeout(1000);
  await page.locator("#login_password").pressSequentially(vuforiaPassword, { delay: 100 });
  await page.waitForTimeout(1000);
  await page.locator("#login").click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"));
};

const goToDatabase = async (page: Page, databaseName: string) => {
  await page.goto("https://developer.vuforia.com/develop/databases", { waitUntil: "domcontentloaded" });
  await page.getByRole("cell", { name: databaseName }).click();
  await page.waitForURL((url) => url.pathname.includes("/targets"));
};

export const vuforia = async (_req: Request, res: Response) => {
  const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: false });
  try {
    const page = await browser.newPage();
    await login(page);
    await goToDatabase(page, "banknotesReader");
    const filePath: `${string}.png` = `${screenshotDirectoryPath}/vuforia-database.png`;
    await page.screenshot({ path: filePath });
    res.json({ status: "ok", screenshot: filePath });
  } finally {
    await browser.close();
  }
};
