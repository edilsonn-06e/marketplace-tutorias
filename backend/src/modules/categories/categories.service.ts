// src/modules/categories/categories.service.ts
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { audit } from '../../utils/audit';

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  parentId: z.string().uuid().nullable().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// Árbol: categorías principales con sus subcategorías
export function listTree() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
}

async function assertValidParent(parentId: string | null | undefined, selfId?: string) {
  if (!parentId) return;
  if (parentId === selfId) throw new HttpError(400, 'INVALID_PARENT', 'Una categoría no puede ser su propio padre');
  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  if (!parent) throw new HttpError(400, 'INVALID_PARENT', 'La categoría padre no existe');
  if (parent.parentId) throw new HttpError(400, 'INVALID_PARENT', 'Solo se permiten dos niveles');
}

export async function create(adminId: string, data: CategoryInput) {
  await assertValidParent(data.parentId);
  const category = await prisma.category.create({ data });
  await audit(prisma, adminId, 'CATEGORY_CREATED', 'Category', category.id, { name: category.name });
  return category;
}

export async function update(adminId: string, id: string, data: CategoryInput) {
  await assertValidParent(data.parentId, id);
  const category = await prisma.category.update({ where: { id }, data });
  await audit(prisma, adminId, 'CATEGORY_UPDATED', 'Category', id, data);
  return category;
}

export async function remove(adminId: string, id: string) {
  await prisma.category.delete({ where: { id } }); // P2003 si hay ofertas usando la categoría → 409
  await audit(prisma, adminId, 'CATEGORY_DELETED', 'Category', id);
}