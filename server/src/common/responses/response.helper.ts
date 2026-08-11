import { Response } from "express";
import { ApiResponse } from "./ApiResponse";

export const ok = <T>(res: Response, message: string, data?: T) => {
  return res.status(200).json(new ApiResponse(true, message, data));
};

export const created = <T>(res: Response, message: string, data?: T) => {
  return res.status(201).json(new ApiResponse(true, message, data));
};
