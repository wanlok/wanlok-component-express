import fs from "fs";
import { Browser, Page } from "playwright";
import { vuforiaUsername, vuforiaPassword, vuforiaDebugMode } from "./config";

export const baseUrl = "https://developer.vuforia.com";

const pageSize = 200;
const sessionFilePath = ".vuforia-session.json";
const typingDelay = vuforiaDebugMode ? 100 : 0;

export const delay = async (page: Page, ms: number) => {
  if (vuforiaDebugMode) {
    await page.waitForTimeout(ms);
  }
};

interface Database {
  project_name: string;
  project_id: string;
}

export interface Target {
  target_id: string;
  target_name: string;
  image_url: string;
}

export interface FileInput {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export const getUserId = async (page: Page) => {
  const url = `${baseUrl}/targetmanager/vuforiaUtil/getLoggedInUser`;
  const text = await (await page.request.get(url)).text();
  if (!text) {
    return undefined;
  }
  const user = JSON.parse(text);
  return user.userId ? String(user.userId) : undefined;
};

export const getDatabaseId = async (page: Page, userId: string, databaseName: string) => {
  const url = `${baseUrl}/targetmanager/project/databases`;
  const databases: { list: Database[] } = await (
    await page.request.post(url, {
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
  const url = `${baseUrl}/targetmanager/project/userDeviceTargetDisplayListing`;
  const response: { aaData: Target[]; iTotalRecords: number } = await (
    await page.request.post(url, {
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
    targets: response.aaData.map((target) => ({
      target_id: target.target_id,
      target_name: target.target_name,
      image_url: target.image_url
    })),
    iTotalRecords: response.iTotalRecords
  };
};

export const getTargets = async (page: Page, userId: string, databaseId: string) => {
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

export const getTargetId = async (page: Page, userId: string, databaseId: string, targetName: string) => {
  let displayStart = 0;
  while (true) {
    const targetsPage = await getTargetsPage(page, userId, databaseId, displayStart);
    const match = targetsPage.targets.find((target) => target.target_name === targetName);
    if (match) {
      return match.target_id;
    }
    displayStart += pageSize;
    if (displayStart >= targetsPage.iTotalRecords) {
      return undefined;
    }
    await delay(page, 1000);
  }
};

const login = async (page: Page) => {
  const url = `${baseUrl}/auth/login`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#onetrust-accept-btn-handler").click();
  await delay(page, 1000);
  await page.locator("#login_email").pressSequentially(vuforiaUsername, { delay: typingDelay });
  await delay(page, 1000);
  await page.locator("#login_password").pressSequentially(vuforiaPassword, { delay: typingDelay });
  await delay(page, 1000);
  await page.locator("#login").click();
  await page.waitForURL(`${baseUrl}/develop/dashboard`);
};

export const authenticate = async (browser: Browser) => {
  const hasSession = fs.existsSync(sessionFilePath);
  const context = await browser.newContext(hasSession ? { storageState: sessionFilePath } : undefined);
  const page = await context.newPage();
  let userId = hasSession ? await getUserId(page) : undefined;
  if (!userId) {
    await login(page);
    userId = await getUserId(page);
    if (!userId) {
      throw new Error("Login failed");
    }
    await context.storageState({ path: sessionFilePath });
  }
  return { page, userId };
};

export const createTarget = async (page: Page, databaseId: string, name: string, width: number, file: FileInput) => {
  const url = `${baseUrl}/targetmanager/singleDeviceTarget/createNonCloudTarget`;
  const response = await page.request.post(url, {
    multipart: {
      fileData: { name: file.originalname, mimeType: file.mimetype, buffer: file.buffer },
      projectId: databaseId,
      name,
      width: String(width),
      targetType: "image"
    }
  });
  return response.text();
};

export const deleteTargets = async (page: Page, databaseId: string, databaseName: string, targetIds: string[]) => {
  const url = `${baseUrl}/targetmanager/project/deleteDatabaseTargets`;
  const response = await page.request.post(url, {
    multipart: {
      device_target_listing: "device_target_listing",
      project_id_device: databaseId,
      typeDevice: "NON_CLOUD",
      projectNameDevice: databaseName,
      project_status: "",
      TARGET_IDS: targetIds.map((targetId) => `${targetId}::`).join("")
    }
  });
  return response.text();
};
