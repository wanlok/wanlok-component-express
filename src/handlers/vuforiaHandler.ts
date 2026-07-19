import { Request, Response } from "express";
import multer from "multer";
import { chromium } from "playwright";
import { chromeExecutablePath, vuforiaDebugMode } from "../utils/config";
import { Handler } from "../utils/types";
import {
  authenticate,
  getDatabaseId,
  getTargets,
  getTargetId,
  createTarget,
  deleteTargets,
  delay
} from "../utils/VuforiaUtils";

const vuforiaHandler = {
  get: async (_req: Request, res: Response) => {
    const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: !vuforiaDebugMode });
    try {
      const { page, userId } = await authenticate(browser);
      const databaseId = await getDatabaseId(page, userId, "banknotesReader");
      if (!databaseId) {
        throw new Error("Database not found: banknotesReader");
      }
      const targets = await getTargets(page, userId, databaseId);
      res.json({ status: "ok", data: targets });
    } catch (e) {
      res.status(500);
      res.json({ status: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      await browser.close();
    }
  },
  post: async (req: Request, res: Response) => {
    const { name, width } = req.body || {};
    if (!name) {
      res.status(400);
      res.json({ status: "error", message: "Missing name" });
      return;
    }
    if (!width || isNaN(Number(width))) {
      res.status(400);
      res.json({ status: "error", message: "Missing or invalid width" });
      return;
    }
    if (!req.file) {
      res.status(400);
      res.json({ status: "error", message: "Missing image" });
      return;
    }
    const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: !vuforiaDebugMode });
    try {
      const { page, userId } = await authenticate(browser);
      const databaseId = await getDatabaseId(page, userId, "banknotesReader");
      if (!databaseId) {
        throw new Error("Database not found: banknotesReader");
      }
      const message = await createTarget(page, databaseId, name, Number(width), req.file);
      res.json({ status: "ok", message });
    } catch (e) {
      res.status(500);
      res.json({ status: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      await browser.close();
    }
  },
  postParams: multer({ storage: multer.memoryStorage() }).single("image"),
  delete: async (req: Request, res: Response) => {
    const namesQuery = req.query.names;
    const names = (Array.isArray(namesQuery) ? namesQuery : namesQuery ? [namesQuery] : []).map(String);
    if (names.length === 0) {
      res.status(400);
      res.json({ status: "error", message: "Missing names" });
      return;
    }
    const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: !vuforiaDebugMode });
    try {
      const databaseName = "banknotesReader";
      const { page, userId } = await authenticate(browser);
      const databaseId = await getDatabaseId(page, userId, databaseName);
      if (!databaseId) {
        throw new Error(`Database not found: ${databaseName}`);
      }
      const targetIds: string[] = [];
      const notFound: string[] = [];
      for (const name of names) {
        const targetId = await getTargetId(page, userId, databaseId, name);
        if (targetId) {
          targetIds.push(targetId);
        } else {
          notFound.push(name);
        }
        await delay(page, 1000);
      }
      if (targetIds.length === 0) {
        throw new Error(`Targets not found: ${notFound.join(", ")}`);
      }
      const message = await deleteTargets(page, databaseId, databaseName, targetIds);
      res.json({ status: "ok", message, notFound });
    } catch (e) {
      res.status(500);
      res.json({ status: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      await browser.close();
    }
  }
} satisfies Handler;

export default vuforiaHandler;
