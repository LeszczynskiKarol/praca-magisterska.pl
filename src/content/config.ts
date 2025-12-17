// src/content/config.ts
import { defineCollection, z } from "astro:content";

// Kolekcja poradników
const poradnikiCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    readingTime: z.string().default("10 min"),
    icon: z.string().default("📝"),
    category: z.enum([
      "start",
      "struktura",
      "badania",
      "pisanie",
      "finalizacja",
    ]),
    order: z.number().default(0),
    featured: z.boolean().default(false),
    relatedLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
        })
      )
      .default([]),
  }),
});

// Kolekcja tematów per kierunek
const tematyCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    kierunek: z.string(),
    kierunekSlug: z.string(),
    kierunekIcon: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    // Tematy prac
    tematy: z
      .array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          difficulty: z.enum(["łatwy", "średni", "trudny"]).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .default([]),
    // Metadane
    metaTips: z.array(z.string()).default([]),
  }),
});

export const collections = {
  poradniki: poradnikiCollection,
  tematy: tematyCollection,
};
