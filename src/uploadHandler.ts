import { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import { fileUploadDirectory } from "./config";

interface FileInfo {
  originalName?: string;
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

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, fileUploadDirectory),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const fileFilter = (req: UploadRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const accepted = mimeTypes.includes(file.mimetype);
  if (!req.fileInfoList) {
    req.fileInfoList = [];
  }
  req.fileInfoList.push({
    originalName: file.originalname,
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
  for (const file of (req.files as Express.Multer.File[]) || []) {
    const fileInfo = uploadRequest.fileInfoList.find((fileInfo) => fileInfo.originalName === file.originalname);
    if (fileInfo) {
      fileInfo.name = `${encodeURIComponent(file.filename)}`;
    }
  }
  for (const fileInfo of uploadRequest.fileInfoList) {
    if (!fileInfo.name && !fileInfo.reject_reason) {
      fileInfo.reject_reason = "FILE_SIZE_TOO_LARGE";
    }
  }
  res.json(uploadRequest.fileInfoList);
};
