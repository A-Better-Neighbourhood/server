/** @format */

import { RequestHandler } from "express";
import { authService } from "../services/auth.service";
import { signInSchema, signUpSchema } from "../schemas/auth.schema";
import { ZodError } from "zod";
import { ResponseHandler } from "../utils/response";

export const signIn: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, password } = signInSchema.parse(req.body);

    const authResponse = await authService.signIn(phoneNumber, password);

    res.cookie("token", authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return ResponseHandler.success(
      res,
      authResponse.user,
      "Sign in successful"
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseHandler.badRequest(res, "Validation error", error.issues);
    }

    return ResponseHandler.unauthorized(
      res,
      error instanceof Error ? error.message : "Authentication failed"
    );
  }
};

export const signUp: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, password, name, address } = signUpSchema.parse(
      req.body
    );

    const authResponse = await authService.signUp(
      phoneNumber,
      password,
      name,
      address
    );

    return ResponseHandler.success(
      res,
      authResponse,
      "Account created successfully",
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseHandler.badRequest(res, "Validation error", error.issues);
    }

    return ResponseHandler.badRequest(
      res,
      error instanceof Error ? error.message : "Failed to create account"
    );
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return ResponseHandler.unauthorized(res);
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    return ResponseHandler.success(res, user);
  } catch (error) {
    return ResponseHandler.serverError(res);
  }
};
