import { RequestHandler } from "express";

export interface Handler {
  get?: RequestHandler;
  post?: RequestHandler;
  postParams?: RequestHandler;
  delete?: RequestHandler;
}
