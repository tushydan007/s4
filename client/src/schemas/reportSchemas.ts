import { z } from "zod";

export const reportSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title must be at most 255 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  category: z.enum(
    [
      "robbery",
      "assault",
      "fire",
      "accident",
      "kidnapping",
      "terrorism",
      "flooding",
      "suspicious",
      "gunshot",
      "vandalism",
      "medical",
      "other",
    ],
    { required_error: "Please select a category" },
  ),
  severity: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select severity level",
  }),
  latitude: z.number({ required_error: "Please select a location on the map" }),
  longitude: z.number({
    required_error: "Please select a location on the map",
  }),
});

export type ReportFormData = z.infer<typeof reportSchema>;
