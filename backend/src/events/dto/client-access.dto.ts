import { z } from 'zod';

export const ClientAccessDtoSchema = z.object({
  clientName: z.string().min(1, 'Name is required').max(100),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
});

export type ClientAccessDto = z.infer<typeof ClientAccessDtoSchema>;
