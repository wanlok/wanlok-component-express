import dotenv from "dotenv";
dotenv.config();

export const certDirectory = process.env.CERT_DIRECTORY || "";
export const fileUploadDirectory = process.env.FILE_UPLOAD_DIRECTORY || "";
export const screenshotDirectory = process.env.SCREENSHOT_DIRECTORY || "";
export const chromeExecutablePath = process.env.CHROME_EXECUTABLE_PATH || "";
