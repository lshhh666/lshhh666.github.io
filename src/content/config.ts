import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
const projectsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		link: z.string().url(),
		cover: z.string().optional(),
		coverAlt: z.string().optional(),
		coverWidth: z.number().int().positive().optional(),
		coverHeight: z.number().int().positive().optional(),
		coverCaption: z.string().optional(),
		problem: z.string().optional(),
		contribution: z.string().optional(),
		progress: z.string().optional(),
		order: z.number().default(0),
		year: z.number().optional(),
		status: z.string().optional(),
		role: z.string().optional(),
		tech: z.string().optional(),
	}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
	projects: projectsCollection,
};
