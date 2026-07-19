import dotenv from "dotenv";
dotenv.config();

export const certDirectoryPath = process.env.CERT_DIRECTORY_PATH || "";
export const fileUploadDirectoryPath = process.env.FILE_UPLOAD_DIRECTORY_PATH || "";
export const screenshotDirectoryPath = process.env.SCREENSHOT_DIRECTORY_PATH || "";
export const chromeExecutablePath = process.env.CHROME_EXECUTABLE_PATH || "";
export const githubDirectoryPath = process.env.GITHUB_DIRECTORY_PATH || "";
export const githubFileDirectoryPath =
  `${process.env.GITHUB_DIRECTORY_PATH}${process.env.GITHUB_FILE_DIRECTORY_PATH}` || "";
export const githubScreenshotDirectoryPath =
  `${process.env.GITHUB_DIRECTORY_PATH}${process.env.GITHUB_SCREENSHOT_DIRECTORY_PATH}` || "";
export const vuforiaUsername = process.env.VUFORIA_USERNAME || "";
export const vuforiaPassword = process.env.VUFORIA_PASSWORD || "";
export const vuforiaDebugMode = process.env.VUFORIA_DEBUG_MODE === "true";
