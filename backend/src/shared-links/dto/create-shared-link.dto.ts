import { z } from 'zod';

export const CreateSharedLinkDtoSchema = z.object({
  expiresInDays: z.number().min(1).max(365).optional(),
});

export type CreateSharedLinkDto = z.infer<typeof CreateSharedLinkDtoSchema>;
