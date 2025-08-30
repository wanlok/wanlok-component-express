import dotenv from "dotenv";
dotenv.config();

export const chromeExecutablePath =
  process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const port = process.env.PORT || 3000;
export const filePath = process.env.FILE_PATH || "/f";
export const fileUploadDirectory = process.env.FILE_UPLOAD_DIRECTORY || "files";
