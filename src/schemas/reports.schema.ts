/** @format */

import z from "zod";

export const CreateReportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().min(1, "Photo is required - please capture a photo"),
  location: z.tuple([z.number(), z.number()]), // Allow any coordinates including [0,0]
  category: z.enum([
    "ROAD_ISSUE",
    "GARBAGE",
    "STREET_LIGHT",
    "WATER_LEAK",
    "NOISE_COMPLAINT",
    "OTHER",
  ]),
});

export const NearbyIssuesSchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z.coerce
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  radius: z.coerce
    .number()
    .min(0.1, "Radius must be at least 0.1km")
    .max(100, "Radius cannot exceed 100km")
    .optional()
    .default(5),
});

export type CreateReportType = z.infer<typeof CreateReportSchema>;
export type NearbyIssuesType = z.infer<typeof NearbyIssuesSchema>;
