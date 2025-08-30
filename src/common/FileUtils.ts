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
