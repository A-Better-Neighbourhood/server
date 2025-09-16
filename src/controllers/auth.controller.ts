/** @format */

import { RequestHandler } from "express";
import { authService } from "../services/auth.service.js";
import { tokenSchema, userDetailsSchema } from "../schemas/auth.schema.js";
import { ZodError } from "zod";

export const signUp: RequestHandler = async (req, res) => {
  try {
    const { idToken } = tokenSchema.parse({
      idToken: req.headers.authorization?.split(" ")[1],
    });

    const userDetails = userDetailsSchema.parse(req.body);

    const user = await authService.signUp(idToken,userDetails);
     
    return res.status(201).json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(401).json(error.message);
    }
    return res.status(500).json({ error: "Server error" });
  }
};


export const signIn: RequestHandler = async (req, res) => {
   try {
    const { idToken } = tokenSchema.parse({
      idToken: req.headers.authorization?.split(" ")[1],
    });

    const user = await authService.signIn(idToken);
     
    return res.status(200).json({ user });

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(401).json(error.message);
    }
    if (error instanceof Error && error.message === "User not found. Please sign up first.") {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: "Server error" });
  }
};


export const signOut: RequestHandler = async (req, res) => {
  try {
    const { idToken } = tokenSchema.parse({
      idToken: req.headers.authorization?.split(" ")[1],
    });

    await authService.signOut(idToken);
    return res.status(200).json({ message: "Signed out successfully." });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid token." });
    }
    return res.status(500).json({ error: "Server error." });
  }
};
