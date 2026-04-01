import { z } from 'zod';

export const GetPhotosQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  tags: z.string().optional(),
});

export type GetPhotosQuery = z.infer<typeof GetPhotosQuerySchema>;
