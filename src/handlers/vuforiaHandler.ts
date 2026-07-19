import { Request, Response } from "express";
import { chromium, Page } from "playwright";
import { chromeExecutablePath, vuforiaUsername, vuforiaPassword, vuforiaDebugMode } from "../utils/config";

const pageSize = 200;
const typingDelay = vuforiaDebugMode ? 100 : 0;

const delay = async (page: Page, ms: number) => {
  if (vuforiaDebugMode) {
    await page.waitForTimeout(ms);
  }
};

interface Database {
  project_name: string;
  project_id: string;
}

interface Target {
  target_name: string;
  image_url: string;
}

const getUserId = async (page: Page) => {
  const user = await (
    await page.request.get("https://developer.vuforia.com/targetmanager/vuforiaUtil/getLoggedInUser")
  ).json();
  return String(user.userId);
};

const getDatabaseId = async (page: Page, userId: string, databaseName: string) => {
  const databases: { list: Database[] } = await (
    await page.request.post("https://developer.vuforia.com/targetmanager/project/databases", {
      data: {
        page: 1,
        count: 25,
        starting_index: 0,
        search_value: databaseName,
        sort_order: "ASC",
        search_key: 0,
        sorting: 0,
        account_id: userId
      }
    })
  ).json();
  return databases.list.find((database) => database.project_name === databaseName)?.project_id;
};

const getTargetsPage = async (page: Page, userId: string, databaseId: string, displayStart: number) => {
  const response: { aaData: Target[]; iTotalRecords: number } = await (
    await page.request.post("https://developer.vuforia.com/targetmanager/project/userDeviceTargetDisplayListing", {
      data: {
        dataToBeShownForUser: userId,
        sEcho: 1,
        iColumns: 6,
        sColumns: "",
        iDisplayStart: displayStart,
        iDisplayLength: pageSize,
        amDataProp: [0, 1, 2, 3, 4, 5],
        sSearch: "",
        bRegex: false,
        asSearch: ["", "", "", "", "", ""],
        abRegex: [false, false, false, false, false, false],
        abSearchable: [true, true, true, true, true, true],
        aiSortCol: [5],
        asSortDir: ["desc"],
        iSortingCols: 1,
        abSortable: [false, false, false, false, false, false],
        synch: false,
        projectId: databaseId,
        projectIds: [1, 2, 3],
        isLegacyProject: false,
        dbListingType: "device"
      }
    })
  ).json();
  return {
    targets: response.aaData.map((target) => ({ target_name: target.target_name, image_url: target.image_url })),
    iTotalRecords: response.iTotalRecords
  };
};

const getTargets = async (page: Page, userId: string, databaseId: string) => {
  const targets: Target[] = [];
  let displayStart = 0;
  while (true) {
    const targetsPage = await getTargetsPage(page, userId, databaseId, displayStart);
    targets.push(...targetsPage.targets);
    displayStart += pageSize;
    if (displayStart >= targetsPage.iTotalRecords) {
      break;
    }
    await delay(page, 1000);
  }
  return targets;
};

const login = async (page: Page) => {
  const url = "https://developer.vuforia.com/auth/login";
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#onetrust-accept-btn-handler").click();
  await delay(page, 1000);
  await page.locator("#login_email").pressSequentially(vuforiaUsername, { delay: typingDelay });
  await delay(page, 1000);
  await page.locator("#login_password").pressSequentially(vuforiaPassword, { delay: typingDelay });
  await delay(page, 1000);
  await page.locator("#login").click();
  await page.waitForURL((url) => url.pathname.includes("/develop/dashboard"));
};

export const vuforia = async (_req: Request, res: Response) => {
  const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: !vuforiaDebugMode });
  try {
    const page = await browser.newPage();
    await login(page);
    const userId = await getUserId(page);
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
};
