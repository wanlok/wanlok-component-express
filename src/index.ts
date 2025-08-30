import express from "express";
import cors from "cors";
import fs from "fs";
import https from "https";
import { pdf } from "./pdf";
import { barChart1 } from "./barChart1";
import { upload, uploadParams } from "./uploadHandler";
import { certDirectory, fileUploadDirectory, screenshotDirectory } from "./common/config";
import { saveScreenshot } from "./screenshotHandler";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "https://wanlok.github.io"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

const options = {
  key: fs.readFileSync(`${certDirectory}/privkey.pem`),
  cert: fs.readFileSync(`${certDirectory}/fullchain.pem`)
};

app.use(express.json());

app.use("/files", express.static(fileUploadDirectory));
app.use("/screenshot", express.static(screenshotDirectory));

app.get("/pdf", pdf);
app.get("/save-screenshot", saveScreenshot);

app.post("/bar-chart-1", barChart1);
app.post(`/upload`, uploadParams, upload);

https.createServer(options, app).listen(443, () => {
  console.log("Node app running securely on port 443");
});
