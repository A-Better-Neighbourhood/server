/** @format */

import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        contactNo: string;
        fullName: string;
        address: string;
      };
    }
  }
}

export {};
