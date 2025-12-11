/** @format */

import z from "zod";

export const CreateReportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().min(1, "Photo is required - please capture a photo"),
  location: z.tuple([z.number(), z.number()]), // Allow any coordinates including [0,0]
});

export type CreateReportType = z.infer<typeof CreateReportSchema>;
