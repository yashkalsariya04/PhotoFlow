import { z } from 'zod';

export const CreateEventDtoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  eventDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

export type CreateEventDto = z.infer<typeof CreateEventDtoSchema>;
