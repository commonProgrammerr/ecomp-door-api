import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decodedToken = jwt.verify(token || '', "RANDOM_TOKEN_SECRET");
    const userId = decodedToken;

    console.log('authtoken: ', userId)
    if (req.body.userId && req.body.userId !== userId) {
      res.status(401).json({
        error: new Error("Unauthorized!"),
      });
    } else {
      next();
    }
  } catch {
    res.status(401).json({
      message: "Invalid request!"
    });
  }
};
