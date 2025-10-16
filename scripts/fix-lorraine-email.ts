// FILE: scripts/fix-lorraine-email.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const targetLower = "harmonlorraine363@gmail.com";
  // Find regardless of case
  const user = await prisma.user.findFirst({
    where: { email: { equals: targetLower, mode: "insensitive" } },
    select: { id: true, email: true },
  });

  if (!user) {
    console.log(
      "Lorraine not found (case-insensitive). Are you on the same DB used by the app?"
    );
    return;
  }

  if (user.email !== targetLower) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: targetLower },
    });
    console.log(`Email normalized: ${user.email} -> ${targetLower}`);
  } else {
    console.log("Email already lowercase; nothing to change.");
  }
}

run()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
