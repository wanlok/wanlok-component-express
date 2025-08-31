import { createHash } from "crypto";
import fs from "fs";

export const getFileExtension = (mimeType: string) => {
  let fileExtension = "";
  if (mimeType === "image/jpeg") {
    fileExtension = ".jpg";
  } else if (mimeType === "image/png") {
    fileExtension = ".png";
  } else if (mimeType === "image/gif") {
    fileExtension = ".gif";
  } else if (mimeType === "image/webp") {
    fileExtension = ".webp";
  }
  return fileExtension;
};

export const getMD5 = async (filePath: string) => {
  const buffer = await fs.promises.readFile(filePath);
  return createHash("md5").update(buffer).digest("hex");
};
