import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

async function main() {
  const email = "admin@ganrajlogistics.in";
  const password = "ganraj@123";
  const name = "Ganraj Admin";

  const existing = await db.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  await db.admin.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
    },
  });

  console.log("Seeded admin account:");
  console.log("  Email:   ", email);
  console.log("  Password:", password);
  console.log("  Name:    ", name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
