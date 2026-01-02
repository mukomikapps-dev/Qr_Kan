import { db } from "./client";
import { users, profiles, blocks } from "./schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

async function main() {
  // upsert demo user
  const demoEmail = "demo@example.com";
  const existingUsers = await db.select().from(users).where(eq(users.email, demoEmail));
  const userId = existingUsers[0]?.id ?? randomUUID();
  if (!existingUsers.length) {
    await db.insert(users).values({
      id: userId,
      email: demoEmail,
    });
  }

  // upsert demo profile
  const username = "demo";
  const existingProfiles = await db.select().from(profiles).where(eq(profiles.username, username));
  const profileId = existingProfiles[0]?.id ?? randomUUID();
  if (!existingProfiles.length) {
    await db.insert(profiles).values({
      id: profileId,
      userId,
      username,
      displayName: "QR Kan Demo",
      bio: "Contoh halaman QR Kan dengan beberapa tautan.",
      avatarUrl: null as unknown as string,
      themeJson: null as unknown as string,
    });
  }

  const existingBlocks = await db.select().from(blocks).where(eq(blocks.profileId, profileId));
  if (existingBlocks.length === 0) {
    await db.insert(blocks).values([
      {
        id: randomUUID(),
        profileId,
        type: "link",
        dataJson: JSON.stringify({ title: "Website", url: "https://example.com" }),
        order: 0,
        isVisible: true,
      },
      {
        id: randomUUID(),
        profileId,
        type: "social",
        dataJson: JSON.stringify({ platform: "instagram", handle: "demo" }),
        order: 1,
        isVisible: true,
      },
      {
        id: randomUUID(),
        profileId,
        type: "text",
        dataJson: JSON.stringify({ text: "Selamat datang di QR Kan!" }),
        order: 2,
        isVisible: true,
      },
    ]);
  }
  console.log("Seed selesai. Username demo tersedia di /@demo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


