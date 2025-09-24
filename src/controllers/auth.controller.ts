/** @format */

import { RequestHandler } from "express";
import { authService } from "../services/auth.service.js";
import { signInSchema, signUpSchema } from "../schemas/auth.schema.js";
import { ZodError } from "zod";

export const signIn: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, password } = signInSchema.parse(req.body);

    const authResponse = await authService.signIn(phoneNumber, password);

    return res.status(200).json({
      success: true,
      message: "Sign in successful",
      data: authResponse,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Authentication failed",
    });
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

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: authResponse,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create account",
    });
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
