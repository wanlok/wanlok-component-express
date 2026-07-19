import { Request, Response } from "express";
import { Browser, chromium, Page } from "playwright";
import { chromeExecutablePath, vuforiaDebugMode } from "../utils/config";
import { Handler } from "../utils/types";
import {
  authenticate,
  getDatabaseId,
  getTargets,
  createTarget,
  deleteTargets,
  delay,
  FileInput
} from "../utils/VuforiaUtils";

interface Banknote {
  name: string;
  url: string;
  width: number;
  height: number;
}

const getBanknotes = async (browser: Browser) => {
  const page = await browser.newPage();
  const url = "https://wanlok.github.io/#/api/banknotes";
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    try {
      return Object.keys(JSON.parse(document.body.innerText)).length > 0;
    } catch {
      return false;
    }
  });
  const text = await page.evaluate(() => document.body.innerText);
  await page.close();
  const banknotes: Record<string, Banknote> = JSON.parse(text);
  return Object.values(banknotes);
};

const downloadImage = async (page: Page, url: string): Promise<FileInput> => {
  const response = await page.request.get(url);
  const buffer = await response.body();
  const mimetype = response.headers()["content-type"] || "image/jpeg";
  const originalname = url.split("/").pop() || "image.jpg";
  return { originalname, mimetype, buffer };
};

const vuforiaSyncHandler = {
  get: async (_req: Request, res: Response) => {
    const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: !vuforiaDebugMode });
    try {
      const banknotes = await getBanknotes(browser);
      const { page, userId } = await authenticate(browser);
      const databaseName = "banknotesReader";
      const databaseId = await getDatabaseId(page, userId, databaseName);
      if (!databaseId) {
        throw new Error(`Database not found: ${databaseName}`);
      }
      const existingTargets = await getTargets(page, userId, databaseId);

      const banknoteNames = new Set(banknotes.map((banknote) => banknote.name));
      const existingNames = new Set(existingTargets.map((target) => target.target_name));

      const staleTargetIds = existingTargets
        .filter((target) => !banknoteNames.has(target.target_name))
        .map((target) => target.target_id);
      const missingBanknotes = banknotes.filter((banknote) => !existingNames.has(banknote.name));

      let deleted: string[] = [];
      if (staleTargetIds.length > 0) {
        await deleteTargets(page, databaseId, databaseName, staleTargetIds);
        deleted = existingTargets
          .filter((target) => staleTargetIds.includes(target.target_id))
          .map((target) => target.target_name);
      }

      const created: string[] = [];
      for (const banknote of missingBanknotes) {
        const file = await downloadImage(page, banknote.url);
        await createTarget(page, databaseId, banknote.name, banknote.width, file);
        created.push(banknote.name);
        await delay(page, 1000);
      }

      res.json({ status: "ok", data: { deleted, created } });
    } catch (e) {
      res.status(500);
      res.json({ status: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      await browser.close();
    }
  }
} satisfies Handler;

export default vuforiaSyncHandler;
