import express from "express";
import cors from "cors";
import fs from "fs";
import https from "https";
import { pdf } from "./pdf";
import { barChart1 } from "./barChart1";
import { upload, uploadParams } from "./uploadHandler";
import { filePath, fileUploadDirectory } from "./config";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "https://wanlok.github.io"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

const options = {
  key: fs.readFileSync("C:/Certbot/live/wanlok.ddns.net/privkey.pem"),
  cert: fs.readFileSync("C:/Certbot/live/wanlok.ddns.net/fullchain.pem")
};

app.use(express.json());

app.use(filePath, express.static(fileUploadDirectory));

app.get("/pdf", pdf);

app.post("/bar-chart-1", barChart1);
app.post(`/upload`, uploadParams, upload);

https.createServer(options, app).listen(443, () => {
  console.log("Node app running securely on port 443");
});
