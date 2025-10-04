import crypto from "crypto";

const algorithm = "aes-256-cbc";
const salt = crypto.randomBytes(16);
const iterations = 100000;
const keyLength = 32;
const digest = "sha256";

export function encrypt(text: string, password: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [salt.toString("hex"), iv.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(encryptedText: string, password: string): string {
  const [saltHex, ivHex, encryptedHex] = encryptedText.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
