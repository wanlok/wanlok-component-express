import { Request, Response } from "express";
import { JSDOM } from "jsdom";
import { decrypt } from "../common/SecretUtils";
import puppeteer from "puppeteer";
import { browserOptions } from "../common/PuppeteerUtils";
import path, { basename } from "path";
import os from "os";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { Readable } from "stream";

const getDocument = async (url: any) => {
  let document: Document | null;
  if (typeof url === "string") {
    const response = await fetch(url);
    const html = await response.text();
    document = new JSDOM(html).window.document;
  } else {
    document = null;
  }
  return document;
};

const getAll = (req: Request, document: Document | null) => {
  const url = decrypt(
    "c895c48bf75532edcdd155f6ca562e71:5da52ff25c379ab162cfcb6c6c40cf8e:1b9551ed13376f54643070ddf8682cbd",
    (req.query.password as string) ?? ""
  );
  const listItems = document?.getElementById("comic_chapter")?.getElementsByTagName("ul")[0].getElementsByTagName("li");
  return listItems
    ? Array.from(listItems).map((listItem) => {
        const href = listItem.getElementsByTagName("a")[0].getAttribute("href");
        return `https://${url}/${href}`;
      })
    : [];
};

const getDocumentWithPuppeteer = async (url: string) => {
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const html = await page.content();
  await browser.close();
  return html;
};

const getDummy = async (urlString: string) => {
  const html = await getDocumentWithPuppeteer(urlString);
  const document = new JSDOM(html).window.document;
  return {
    title: document.getElementsByClassName("redhotl")[0].innerHTML,
    imageUrls: Array.from(document.getElementById("pic_list")?.querySelectorAll("div.pic") ?? [])
      .map((div) => {
        const img = div.querySelector("img");
        return img?.getAttribute("src") || div.getAttribute("_src");
      })
      .filter(Boolean)
  };
};

const getDownloadFolderPath = (folderName: string) => {
  const homeDir = os.homedir();
  const downloadsDir = path.join(homeDir, "Downloads");
  return path.join(downloadsDir, folderName);
};

export const save = async (folderName: string, imageUrls: (string | null)[]) => {
  const folderPath = getDownloadFolderPath(folderName);

  try {
    await fs.mkdir(folderPath, { recursive: true });
    console.log(`Created folder: ${folderPath}`);

    for (const url of imageUrls) {
      if (!url) continue;
      const fileName = basename(url);
      const filePath = path.join(folderPath, fileName);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        const stream = createWriteStream(filePath);
        const nodeStream = Readable.fromWeb(response.body as any); // Cast to any to bypass TS mismatch

        await new Promise<void>((resolve, reject) => {
          nodeStream.on("error", reject);
          stream.on("error", reject);
          stream.on("finish", resolve);
          nodeStream.pipe(stream);
        });

        console.log(`Downloaded: ${fileName}`);
      } catch (err) {
        console.error(`Error downloading ${url}`, err);
      }
    }
  } catch (err) {
    console.error(`Failed to create folder: ${folderPath}`, err);
  }
};

export const dummy = async (req: Request, res: Response) => {
  let document = await getDocument(req.query.url);
  const links = getAll(req, document);
  for (const link of links) {
    const { title, imageUrls } = await getDummy(link);
    save(title, imageUrls);
  }
  res.json({ status: "OK", url: req.query.url });
};
