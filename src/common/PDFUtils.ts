import { Canvas, createCanvas } from "canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";
import fs from "fs";

const scale = 2;

export const crop16by9 = (canvas: Canvas): Canvas => {
  const width = canvas.width;
  const height = Math.floor((width * 9) / 16);
  const newCanvas = createCanvas(width, height);
  const context = newCanvas.getContext("2d");
  context.drawImage(canvas, 0, 0, width, height, 0, 0, width, height);
  return newCanvas;
};

export const toImages = async (
  response: Response,
  getImageFilePath: (pageNumber: number) => string | undefined,
  crop?: (canvas: Canvas) => Canvas
) => {
  const imageFilePaths: string[] = [];
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await getDocument(arrayBuffer).promise;
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const imageFilePath = getImageFilePath(i);
    if (imageFilePath) {
      const log = console.log;
      console.log = () => {};
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context as any, viewport }).promise;
      const buffer = (crop ? crop(canvas) : canvas).toBuffer("image/png");
      fs.writeFileSync(imageFilePath, buffer);
      console.log = log;
      console.log(imageFilePath);
      imageFilePaths.push(imageFilePath);
    }
  }
  return imageFilePaths;
};
