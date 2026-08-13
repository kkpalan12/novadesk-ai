import { Request, Response } from "express";
import mongoose from "mongoose";

export const healthCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "NovaDesk API is running",
    timestamp: new Date().toISOString(),
  });
};

export const readinessCheck = (_req: Request, res: Response): void => {
  const isDatabaseReady = mongoose.connection.readyState === 1;

  if (!isDatabaseReady) {
    res.status(503).json({
      success: false,
      message: "NovaDesk API is not ready",
      timestamp: new Date().toISOString(),
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "NovaDesk API is ready",
    timestamp: new Date().toISOString(),
  });
};
