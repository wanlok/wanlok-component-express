import express from "express";
import cors from "cors";
import fs from "fs";
import https from "https";
import { certDirectoryPath, fileUploadDirectoryPath, screenshotDirectoryPath } from "./utils/config";
import { health } from "./handlers/healthHandler";
import { pdf } from "./handlers/pdf";
import { screenshot } from "./handlers/screenshotHandler";
import { upload, uploadParams } from "./handlers/uploadHandler";
import vuforiaHandler from "./handlers/vuforiaHandler";
import vuforiaSyncHandler from "./handlers/vuforiaSyncHandler";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "https://wanlok.github.io"],
    methods: ["GET", "POST", "DELETE"],
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

app.get("/health", health);
app.get("/pdf", pdf);
app.get("/vuforia", vuforiaHandler.get);
app.get("/vuforia-sync", vuforiaSyncHandler.get);

app.post("/save-screenshot", screenshot);
app.post(`/upload`, uploadParams, upload);
app.post("/vuforia", vuforiaHandler.postParams, vuforiaHandler.post);

app.delete("/vuforia", vuforiaHandler.delete);

https.createServer(options, app).listen(443, () => {
  console.log("Node app running securely on port 443");
});
