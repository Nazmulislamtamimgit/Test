import bcrypt from "bcrypt";
import { HttpError } from "../utils/http";
import { prisma } from "../utils/prisma";
import { publicUser } from "./auth.service";

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUser });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

export async function updateProfile(
  id: string,
  input: { name?: string; email?: string; currentPassword?: string; newPassword?: string }
) {
  const data: { name?: string; email?: string; passwordHash?: string } = {};
  if (input.name) data.name = input.name;
  if (input.email) data.email = input.email;

  if (input.newPassword) {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current || !(await bcrypt.compare(input.currentPassword ?? "", current.passwordHash))) {
      throw new HttpError(400, "Current password is incorrect");
    }
    data.passwordHash = await bcrypt.hash(input.newPassword, 12);
  }
  // A duplicate email surfaces as Prisma P2002 -> 409 in the error handler.
  return prisma.user.update({ where: { id }, data, select: publicUser });
}

export async function getStats(userId: string) {
  const [byStatus, overdue, notes, recentTasks] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
    prisma.task.count({ where: { userId, status: { not: "DONE" }, dueDate: { lt: new Date() } } }),
    prisma.note.count({ where: { userId } }),
    prisma.task.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const row of byStatus) counts[row.status] = row._count._all;
  return {
    tasks: { total: counts.TODO + counts.IN_PROGRESS + counts.DONE, ...counts, overdue },
    notes,
    recentTasks,
  };
}
