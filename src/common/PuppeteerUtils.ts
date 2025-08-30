import { LaunchOptions } from "puppeteer";
import { chromeExecutablePath } from "./config";

export const browserOptions: LaunchOptions = {
  executablePath: chromeExecutablePath,
  headless: true
};
