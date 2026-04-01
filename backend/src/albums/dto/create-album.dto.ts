import { z } from 'zod';

export const CreateAlbumDtoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  isSmart: z.boolean().optional().default(false),
  tagRules: z.array(z.string()).optional().default([]),
  photoIds: z.array(z.string()).optional().default([]),
});

export type CreateAlbumDto = z.infer<typeof CreateAlbumDtoSchema>;
