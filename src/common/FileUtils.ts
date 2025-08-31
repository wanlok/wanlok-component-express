import { exec } from "child_process";
import { createHash } from "crypto";
import fs from "fs";
import { githubDirectoryPath } from "./config";
import PQueue from "p-queue";

const queue = new PQueue({ concurrency: 1 });

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

export const commit = () => {
  queue.add(() => {
    return new Promise<void>((resolve, reject) => {
      const command = `git pull && git add . && (git commit -m "commit" || true) && git push`;
      exec(command, { cwd: githubDirectoryPath }, (error, stdout, stderr) => {
        if (error) {
          console.log(error);
        }
        if (stdout.length > 0) {
          console.log(stdout);
        }
        if (stderr.length > 0) {
          console.log(stderr);
        }
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });
};
