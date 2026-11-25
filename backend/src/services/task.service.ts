import type { Prisma } from "@prisma/client";
import { HttpError } from "../utils/http";
import { prisma } from "../utils/prisma";

type TaskInput = {
  title?: string;
  description?: string | null;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
};

const toData = (i: TaskInput) => ({
  ...i,
  dueDate: i.dueDate === undefined ? undefined : i.dueDate === null ? null : new Date(i.dueDate),
});

// Ownership check: id AND userId must match, otherwise 404 (never reveal that another user's id exists).
async function getOwned(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

export const listTasks = (userId: string, f: { status?: any; priority?: any; q?: string }) => {
  const where: Prisma.TaskWhereInput = { userId, status: f.status, priority: f.priority };
  if (f.q) where.title = { contains: f.q, mode: "insensitive" };
  return prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
};

export const getTask = getOwned;

export const createTask = (userId: string, input: TaskInput) =>
  prisma.task.create({ data: { ...toData(input), title: input.title!, userId } });

export async function updateTask(userId: string, id: string, input: TaskInput) {
  await getOwned(userId, id);
  return prisma.task.update({ where: { id }, data: toData(input) });
}

export async function deleteTask(userId: string, id: string) {
  await getOwned(userId, id);
  await prisma.task.delete({ where: { id } });
}
