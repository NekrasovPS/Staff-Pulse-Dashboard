import { z } from 'zod';

export const OrgNodeDtoSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  headcount: z.number().int().nonnegative(),
  budget: z.number().nonnegative(),
  performance: z.number().min(0).max(100),
  updatedAt: z.string(),
});

export const OrgTreeResponseSchema = z.array(OrgNodeDtoSchema);

export type OrgNodeDto = z.infer<typeof OrgNodeDtoSchema>;

export interface TreeNode extends OrgNodeDto {
  children: TreeNode[];
  level: number;
}