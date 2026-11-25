import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const passwordHash = await bcrypt.hash("Demo@12345", 12);

  // Idempotent: recreate the demo user (cascade removes old tasks/notes).
  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({
    data: { email, name: "Demo User", passwordHash },
  });

  const day = 86_400_000;
  await prisma.task.createMany({
    data: [
      { title: "Install Nginx", description: "Reverse proxy for ports 3000 and 5000", status: "DONE", priority: "HIGH", userId: user.id },
      { title: "Configure firewall", description: "Allow only 22, 80, 443", status: "IN_PROGRESS", priority: "HIGH", dueDate: new Date(Date.now() + 2 * day), userId: user.id },
      { title: "Issue Let's Encrypt certificate", status: "TODO", priority: "MEDIUM", dueDate: new Date(Date.now() + 5 * day), userId: user.id },
      { title: "Set up systemd services", status: "TODO", priority: "MEDIUM", dueDate: new Date(Date.now() - day), userId: user.id },
    ],
  });
  await prisma.note.createMany({
    data: [
      { title: "Ports", content: "Next.js 3000, Express 5000, PostgreSQL 5432 (localhost only).", userId: user.id },
      { title: "Useful commands", content: "journalctl -u backend -f\nnginx -t && systemctl reload nginx", userId: user.id },
    ],
  });
  console.log(`Seeded ${email} / Demo@12345`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
