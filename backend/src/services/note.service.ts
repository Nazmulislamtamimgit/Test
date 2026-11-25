import { HttpError } from "../utils/http";
import { prisma } from "../utils/prisma";

async function getOwned(userId: string, id: string) {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) throw new HttpError(404, "Note not found");
  return note;
}

export const listNotes = (userId: string) =>
  prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });

export const createNote = (userId: string, input: { title: string; content: string }) =>
  prisma.note.create({ data: { ...input, userId } });

export async function updateNote(userId: string, id: string, input: { title?: string; content?: string }) {
  await getOwned(userId, id);
  return prisma.note.update({ where: { id }, data: input });
}

export async function deleteNote(userId: string, id: string) {
  await getOwned(userId, id);
  await prisma.note.delete({ where: { id } });
}
