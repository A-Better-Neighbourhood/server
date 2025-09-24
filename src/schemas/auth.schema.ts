/** @format */

import z from "zod";

export const signInSchema = z.object({
  phoneNumber: z.string().max(10).min(10),
  password: z.string(),
});

export const signUpSchema = z.object({
  phoneNumber: z.string().max(10).min(10),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});
