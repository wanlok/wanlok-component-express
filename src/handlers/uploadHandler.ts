import { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import { fileUploadDirectory } from "../common/config";
import { randomUUID } from "crypto";
import { getFileExtension, getMD5 } from "../common/FileUtils";

interface FileInfo {
  id?: string;
  name?: string;
  mime_type: string;
  reject_reason?: string;
}

interface UploadRequest extends Request {
  fileInfoList: FileInfo[];
}

if (!fs.existsSync(fileUploadDirectory)) {
  fs.mkdirSync(fileUploadDirectory);
}

const getFileName = (file: Express.Multer.File) => `${randomUUID()}${getFileExtension(file.mimetype)}`;

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, fileUploadDirectory),
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
      const filePath = `${fileUploadDirectory}/${file.filename}`;
      const md5 = await getMD5(filePath);
      const newFilePath = `${fileUploadDirectory}/${md5}${getFileExtension(file.mimetype)}`;
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
  res.json(uploadRequest.fileInfoList);
};
