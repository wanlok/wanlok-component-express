import express from "express";
import cors from "cors";
import fs from "fs";
import https from "https";
import { certDirectoryPath, fileUploadDirectoryPath, screenshotDirectoryPath } from "./common/config";
import { pdf } from "./handlers/pdf";
import { screenshot } from "./handlers/screenshotHandler";
import { upload, uploadParams } from "./handlers/uploadHandler";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "https://wanlok.github.io"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

const options = {
  key: fs.readFileSync(`${certDirectoryPath}/privkey.pem`),
  cert: fs.readFileSync(`${certDirectoryPath}/fullchain.pem`)
};

app.use(express.json());

app.use("/files", express.static(fileUploadDirectoryPath));
app.use("/screenshot", express.static(screenshotDirectoryPath));

app.get("/pdf", pdf);
app.get("/save-screenshot", screenshot);

app.post(`/upload`, uploadParams, upload);

https.createServer(options, app).listen(443, () => {
  console.log("Node app running securely on port 443");
});
