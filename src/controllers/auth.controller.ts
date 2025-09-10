/** @format */

import { RequestHandler } from "express";
import { authService } from "../services/auth.service.js";
import { signInSchema } from "../schemas/auth.schema.js";
import { ZodError } from "zod";

export const signIn: RequestHandler = async (req, res) => {
  try {
    const { user } = req;
    const { phoneNumber, password } = signInSchema.parse(req.body);

    if (!user?.id) {
      return res.status(401).json({});
    }

    await authService.signIn(phoneNumber, password);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(401).json(error.message);
    }
  }
};

export const signUp: RequestHandler = (req, res) => {};
