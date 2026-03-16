import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = postgres(connectionString);

/**
 * Generate a cover image URL based on profile username
 * Uses Unsplash API for random images or a placeholder service
 */
function generateCoverImageUrl(username) {
  // Option 1: Use Unsplash random image with seed based on username
  // This ensures the same username always gets the same image
  const seed = Buffer.from(username).toString('hex').substring(0, 8);
  return `https://images.unsplash.com/photo-1537498425046-c894cddc4945?w=800&h=1200&fit=crop&q=80&seed=${seed}`;
  
  // Option 2: Use placeholder.com (if Unsplash not available)
  // return `https://images.placeholder.com/400x600?text=${username}`;
}

async function populateCoverImages() {
  console.log("Starting cover image population...");

  try {
    // Get profiles without cover image
    const profilesWithoutCover = await client`
      SELECT id, username FROM profiles WHERE cover_image_url IS NULL LIMIT 1000
    `;

    console.log(`Found ${profilesWithoutCover.length} profiles without cover image`);

    if (profilesWithoutCover.length === 0) {
      console.log("All profiles already have cover images!");
      return;
    }

    // Update each profile with a generated cover image
    let updated = 0;
    for (const profile of profilesWithoutCover) {
      const coverUrl = generateCoverImageUrl(profile.username);
      
      await client`
        UPDATE profiles SET cover_image_url = ${coverUrl} WHERE id = ${profile.id}
      `;
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`Updated ${updated}/${profilesWithoutCover.length}`);
      }
    }

    console.log(`✓ Successfully updated ${updated} profiles with cover images`);
  } catch (error) {
    console.error("Error updating profiles:", error);
    throw error;
  }
}

populateCoverImages().catch(console.error).finally(() => process.exit(0));
