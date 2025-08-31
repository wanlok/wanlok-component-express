import { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import { githubFileDirectoryPath, fileUploadDirectoryPath } from "../common/config";
import { randomUUID } from "crypto";
import { commit, getFileExtension, getMD5 } from "../common/FileUtils";

interface FileInfo {
  id?: string;
  name?: string;
  mime_type: string;
  reject_reason?: string;
}

interface UploadRequest extends Request {
  fileInfoList: FileInfo[];
}

if (!fs.existsSync(fileUploadDirectoryPath)) {
  fs.mkdirSync(fileUploadDirectoryPath);
}

const getFileName = (file: Express.Multer.File) => `${randomUUID()}${getFileExtension(file.mimetype)}`;

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, fileUploadDirectoryPath),
  filename: (_, file, cb) => cb(null, getFileName(file))
});

const fileFilter = (req: UploadRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const accepted = mimeTypes.includes(file.mimetype);
  if (!req.fileInfoList) {
    req.fileInfoList = [];
  }
  req.fileInfoList.push({
    name: file.originalname,
    mime_type: file.mimetype,
    reject_reason: accepted ? undefined : "MIME_TYPE_NOT_ALLOWED"
  });
  cb(null, accepted);
};

export const uploadParams = (req: Request, res: Response, next: NextFunction) => {
  multer({ storage, fileFilter, limits: { fileSize: 10000000 } }).array("files")(req, res, () => {
    next();
  });
};

export const upload = async (req: Request, res: Response) => {
  const uploadRequest = req as UploadRequest;
  const files = (req.files as Express.Multer.File[]) || [];
  await Promise.all(
    files.map(async (file) => {
      const filePath = `${fileUploadDirectoryPath}/${file.filename}`;
      const md5 = await getMD5(filePath);
      const newFilePath = `${fileUploadDirectoryPath}/${md5}${getFileExtension(file.mimetype)}`;
      await fs.promises.rename(filePath, newFilePath);
      const fileInfo = uploadRequest.fileInfoList.find((info) => info.name === file.originalname);
      if (fileInfo) {
        fileInfo.id = md5;
      }
    })
  );
  for (const fileInfo of uploadRequest.fileInfoList) {
    if (!fileInfo.id && !fileInfo.reject_reason) {
      fileInfo.reject_reason = "FILE_SIZE_TOO_LARGE";
    }
  }
  copyToGithub(uploadRequest.fileInfoList);
  res.json(uploadRequest.fileInfoList);
};

const copyToGithub = async (fileInfos: FileInfo[]) => {
  try {
    for (const fileInfo of fileInfos) {
      if (!fileInfo.reject_reason) {
        const fileExtension = getFileExtension(fileInfo.mime_type);
        const filePath = `${fileUploadDirectoryPath}/${fileInfo.id}${fileExtension}`;
        const newFilePath = `${githubFileDirectoryPath}/${fileInfo.id}${fileExtension}`;
        await fs.promises.copyFile(filePath, newFilePath);
      }
    }
    commit();
  } catch (e) {
    console.log(e);
  }
};
