import { z } from 'zod';

export const AddPhotosToAlbumDtoSchema = z.object({
  photoIds: z.array(z.string()).min(1, 'At least one photo ID is required'),
});

export type AddPhotosToAlbumDto = z.infer<typeof AddPhotosToAlbumDtoSchema>;
