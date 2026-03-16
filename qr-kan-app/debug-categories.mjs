import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const client = postgres(connectionString);

async function parseCategory(catStr) {
  if (!catStr) return [];
  
  let categories = [];
  try {
    const parsed = JSON.parse(catStr);
    if (Array.isArray(parsed)) {
      categories = parsed.map(c => String(c).trim().toLowerCase());
    } else if (typeof parsed === 'string') {
      categories = [parsed.trim().toLowerCase()];
    } else {
      categories = [String(parsed).trim().toLowerCase()];
    }
  } catch {
    // Not JSON, treat as comma-separated string
    categories = catStr.split(',').map(c => c.trim().toLowerCase());
  }
  return categories;
}

async function debugCategories() {
  console.log("=== DEBUGGING CATEGORIES ===\n");

  // Get all profiles with their categories
  const allProfiles = await client`SELECT id, username, category FROM profiles WHERE category IS NOT NULL`;
  
  console.log("All profiles with categories:");
  allProfiles.forEach(p => {
    console.log(`${p.username}: "${p.category}"`);
  });

  console.log("\n=== PARSING CATEGORIES (JAVASCRIPT) ===\n");

  for (const p of allProfiles) {
    const categories = await parseCategory(p.category);
    const hasFloatingmarket = categories.includes('floatingmarket');
    console.log(`${p.username}: [${categories.join(', ')}] - has floatingmarket: ${hasFloatingmarket}`);
  }

  console.log("\n=== CHECKING FILTER LOGIC ===\n");
  const searchCategory = 'floatingmarket';
  const filtered = allProfiles.filter(profile => {
    if (!profile.category) return false;
    const categories = parseCategory(profile.category);
    return categories.includes(searchCategory.toLowerCase().trim());
  });

  console.log(`Profiles with category containing "${searchCategory}":`);
  filtered.forEach(p => {
    console.log(`  ${p.username}`);
  });
  console.log(`Total: ${filtered.length}`);

  // Check profile_categories table
  console.log("\n=== PROFILE_CATEGORIES TABLE ===\n");
  try {
    const profileCats = await client`SELECT profile_id, category FROM profile_categories WHERE category IS NOT NULL`;
    console.log(`Found ${profileCats.length} records in profile_categories:`);
    profileCats.forEach(pc => {
      console.log(`Profile ${pc.profile_id}: "${pc.category}"`);
    });
  } catch (e) {
    console.log("profile_categories table error:", e.message);
  }

  await client.end();
}

debugCategories().catch(console.error);
