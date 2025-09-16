/** @format */

import z from "zod";

export const tokenSchema = z.object({
  idToken: z.string().min(1, "Authorization token is required."),
});

export const userDetailsSchema = z.object({
  userName:z.string().min(1,"Enter Your Name"),
  address:z.string().min(1,"Enter Your Address")
})