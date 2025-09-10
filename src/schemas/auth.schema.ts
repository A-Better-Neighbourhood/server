/** @format */

import z from "zod";

export const signInSchema = z.object({
  phoneNumber: z.number().max(10).min(10),
  password: z.string(),
});
