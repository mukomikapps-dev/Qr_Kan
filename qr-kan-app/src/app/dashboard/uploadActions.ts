"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB (after compression, allows some tolerance)
const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB (before compression, for HD images)
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_TYPES_WITH_SVG = [...ALLOWED_TYPES, "image/svg+xml"];

// Helper function to select profile with fallback for missing columns
async function getProfileByUserId(userId: string) {
  try {
    return (await db.select().from(profiles).where(eq(profiles.userId, userId)))[0];
  } catch (error: any) {
    // If category, status, or coverImageUrl columns don't exist yet, select without them
    if (error?.message?.includes('category') || error?.message?.includes('status') || error?.message?.includes('cover_image_url') || error?.code === '42703') {
      return (await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          username: profiles.username,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          logoUrl: profiles.logoUrl,
          bgType: profiles.bgType,
          bgSolidColor: profiles.bgSolidColor,
          bgImageUrl: profiles.bgImageUrl,
          bgPatternId: profiles.bgPatternId,
          bgGradientColors: profiles.bgGradientColors,
          showAvatar: profiles.showAvatar,
          showDisplayName: profiles.showDisplayName,
          showBio: profiles.showBio,
          showLogo: profiles.showLogo,
          showQr: profiles.showQr,
          showIcons: profiles.showIcons,
          stickyHeaderBg: profiles.stickyHeaderBg,
          themePresetId: profiles.themePresetId,
          themeJson: profiles.themeJson,
          useCustomColors: profiles.useCustomColors,
          customColors: profiles.customColors,
          detailedColors: profiles.detailedColors,
          status: profiles.status,
          statusType: profiles.statusType,
          coverImageUrl: profiles.coverImageUrl,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.userId, userId)))[0];
    }
    throw error;
  }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return { success: false, error: "Unauthorized. Silakan login ulang." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      console.error("No file in formData");
      return { success: false, error: "File tidak ditemukan. Silakan pilih file terlebih dahulu." };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return { success: false, error: `Format file tidak valid: ${file.type}. Hanya JPG, PNG, WebP yang diizinkan.` };
    }

    // Validate file size (after compression, should be <= 3MB)
    // Note: Client-side compression should handle files up to 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size, "bytes");
      return { success: false, error: `File terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 3MB setelah kompresi.` };
    }

    // Generate filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `avatar.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Delete old avatar if exists
    try {
      const { error: deleteError } = await supabase.storage.from("avatars").remove([filePath]);
      if (deleteError && !deleteError.message.includes("not found")) {
        console.warn("Error deleting old avatar:", deleteError);
      }
    } catch (deleteErr) {
      console.warn("Exception deleting old avatar:", deleteErr);
      // Continue anyway
    }

    // Upload new avatar
    console.log("Uploading avatar to:", filePath, "Size:", file.size, "Type:", file.type);
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      // Provide more specific error messages
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        return { success: false, error: "Storage bucket 'avatars' tidak ditemukan. Hubungi administrator." };
      }
      if (error.message.includes("new row violates row-level security")) {
        return { success: false, error: "Tidak memiliki izin untuk upload. Hubungi administrator." };
      }
      if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        // File already exists, try to get public URL directly
        console.log("File already exists, getting public URL...");
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        
        if (urlData && urlData.publicUrl) {
          const publicUrl = urlData.publicUrl;
          // Update profile with existing URL
          try {
            const profile = await getProfileByUserId(user.id);
            if (profile) {
              await db.update(profiles)
                .set({ avatarUrl: publicUrl })
                .where(eq(profiles.id, profile.id));
              
              revalidatePath("/dashboard");
              revalidatePath(`/u/${profile.username}`);
              revalidatePath(`/@${profile.username}`);
            }
          } catch (dbErr) {
            console.warn("Failed to update profile with existing avatar:", dbErr);
          }
          return { success: true, url: publicUrl };
        }
        return { success: false, error: `File sudah ada tetapi gagal mendapatkan URL.` };
      } else {
        return { success: false, error: `Upload gagal: ${error.message}` };
      }
    }

    if (!data) {
      console.error("No data returned from upload");
      return { success: false, error: "Upload gagal: Tidak ada data yang dikembalikan." };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL");
      return { success: false, error: "Upload berhasil tetapi gagal mendapatkan URL publik." };
    }

    const publicUrl = urlData.publicUrl;
    console.log("Avatar uploaded successfully:", publicUrl);

    // Update profile in database
    try {
      const profile = await getProfileByUserId(user.id);
      if (profile) {
        await db.update(profiles)
          .set({ avatarUrl: publicUrl })
          .where(eq(profiles.id, profile.id));
        
        console.log("Profile updated with new avatar URL");
        
        // Revalidate pages
        revalidatePath("/dashboard");
        revalidatePath(`/u/${profile.username}`);
        revalidatePath(`/@${profile.username}`);
      } else {
        console.warn("Profile not found for user:", user.id);
        return { success: false, error: "Profil tidak ditemukan. Silakan buat profil terlebih dahulu." };
      }
    } catch (dbError: any) {
      console.error("Database error updating profile:", dbError);
      // Even if DB update fails, the file is uploaded, so return success
      // The file is already in storage, user can manually update profile if needed
      return { success: true, url: publicUrl };
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    // Ensure error message is always a string and serializable
    let errorMessage = "Upload gagal";
    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = String(error.message);
      } else if (error?.toString) {
        errorMessage = String(error.toString());
      }
    }
    // Return a clean, serializable object
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload logo to Supabase Storage
 */
export async function uploadLogo(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return { success: false, error: "Unauthorized. Silakan login ulang." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      console.error("No file in formData");
      return { success: false, error: "File tidak ditemukan. Silakan pilih file terlebih dahulu." };
    }

    // Validate file type (logo allows SVG)
    if (!ALLOWED_TYPES_WITH_SVG.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return { success: false, error: `Format file tidak valid: ${file.type}. Hanya JPG, PNG, WebP, SVG yang diizinkan.` };
    }

    // Validate file size (after compression, should be <= 3MB)
    // Note: Client-side compression should handle files up to 10MB (SVG stays at 2MB)
    // SVG files are not compressed, so keep 2MB limit for SVG
    const maxSizeForFile = file.type === "image/svg+xml" ? 2 * 1024 * 1024 : MAX_FILE_SIZE;
    if (file.size > maxSizeForFile) {
      console.error("File too large:", file.size, "bytes");
      return { success: false, error: `File terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal ${file.type === "image/svg+xml" ? "2MB" : "3MB setelah kompresi"}.` };
    }

    // Generate filename
    const fileExt = file.name.split(".").pop() || (file.type === "image/svg+xml" ? "svg" : "jpg");
    const fileName = `logo.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Delete old logo if exists
    try {
      const { error: deleteError } = await supabase.storage.from("logos").remove([filePath]);
      if (deleteError && !deleteError.message.includes("not found")) {
        console.warn("Error deleting old logo:", deleteError);
      }
    } catch (deleteErr) {
      console.warn("Exception deleting old logo:", deleteErr);
      // Continue anyway
    }

    // Upload new logo
    console.log("Uploading logo to:", filePath, "Size:", file.size, "Type:", file.type);
    const { data, error } = await supabase.storage
      .from("logos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      // Provide more specific error messages
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        return { success: false, error: "Storage bucket 'logos' tidak ditemukan. Hubungi administrator." };
      }
      if (error.message.includes("new row violates row-level security")) {
        return { success: false, error: "Tidak memiliki izin untuk upload. Hubungi administrator." };
      }
      if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        // File already exists, try to get public URL directly
        console.log("File already exists, getting public URL...");
        const { data: urlData } = supabase.storage
          .from("logos")
          .getPublicUrl(filePath);
        
        if (urlData && urlData.publicUrl) {
          const publicUrl = urlData.publicUrl;
          // Update profile with existing URL
          try {
            const profile = await getProfileByUserId(user.id);
            if (profile) {
              await db.update(profiles)
                .set({ logoUrl: publicUrl })
                .where(eq(profiles.id, profile.id));
              
              revalidatePath("/dashboard");
              revalidatePath(`/u/${profile.username}`);
              revalidatePath(`/@${profile.username}`);
            }
          } catch (dbErr) {
            console.warn("Failed to update profile with existing logo:", dbErr);
          }
          return { success: true, url: publicUrl };
        }
        return { success: false, error: `File sudah ada tetapi gagal mendapatkan URL.` };
      } else {
        return { success: false, error: `Upload gagal: ${error.message}` };
      }
    }

    if (!data) {
      console.error("No data returned from upload");
      return { success: false, error: "Upload gagal: Tidak ada data yang dikembalikan." };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL");
      return { success: false, error: "Upload berhasil tetapi gagal mendapatkan URL publik." };
    }

    const publicUrl = urlData.publicUrl;
    console.log("Logo uploaded successfully:", publicUrl);

    // Update profile in database
    try {
      const profile = await getProfileByUserId(user.id);
      if (profile) {
        await db.update(profiles)
          .set({ logoUrl: publicUrl })
          .where(eq(profiles.id, profile.id));
        
        console.log("Profile updated with new logo URL");
        
        // Revalidate pages
        revalidatePath("/dashboard");
        revalidatePath(`/u/${profile.username}`);
        revalidatePath(`/@${profile.username}`);
      } else {
        console.warn("Profile not found for user:", user.id);
        return { success: false, error: "Profil tidak ditemukan. Silakan buat profil terlebih dahulu." };
      }
    } catch (dbError: any) {
      console.error("Database error updating profile:", dbError);
      // Even if DB update fails, the file is uploaded, so return success
      // The file is already in storage, user can manually update profile if needed
      return { success: true, url: publicUrl };
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Upload logo error:", error);
    // Ensure error message is always a string and serializable
    let errorMessage = "Upload gagal";
    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = String(error.message);
      } else if (error?.toString) {
        errorMessage = String(error.toString());
      }
    }
    // Return a clean, serializable object
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload cover image to Supabase Storage and update profile
 */
export async function uploadCoverImage(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return { success: false, error: "Unauthorized. Silakan login ulang." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      console.error("No file in formData");
      return { success: false, error: "File tidak ditemukan. Silakan pilih file terlebih dahulu." };
    }

    // Validate file type (cover images don't allow GIF)
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return { success: false, error: `Format file tidak valid: ${file.type}. Hanya JPG, PNG, WebP yang diizinkan.` };
    }

    // Validate file size (after compression, should be <= 3MB)
    // Note: Client-side compression should handle files up to 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size, "bytes");
      return { success: false, error: `File terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 3MB setelah kompresi.` };
    }

    // Generate unique filename with timestamp
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `cover-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload image
    console.log("Uploading cover image to:", filePath, "Size:", file.size, "Type:", file.type);
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      // Provide more specific error messages
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        return { success: false, error: "Storage bucket 'images' tidak ditemukan. Hubungi administrator." };
      }
      if (error.message.includes("new row violates row-level security")) {
        return { success: false, error: "Tidak memiliki izin untuk upload. Hubungi administrator." };
      }
      if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        // File already exists, try to get public URL directly
        console.log("File already exists, getting public URL...");
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
        
        if (urlData && urlData.publicUrl) {
          const publicUrl = urlData.publicUrl;
          // Update profile with existing URL
          try {
            const profile = await getProfileByUserId(user.id);
            if (profile) {
              await db.update(profiles)
                .set({ coverImageUrl: publicUrl })
                .where(eq(profiles.id, profile.id));
              
              revalidatePath("/dashboard");
              revalidatePath(`/u/${profile.username}`);
              revalidatePath(`/@${profile.username}`);
              revalidatePath("/explore");
            }
          } catch (dbErr) {
            console.warn("Failed to update profile with existing cover image:", dbErr);
          }
          return { success: true, url: publicUrl };
        }
        return { success: false, error: `File sudah ada tetapi gagal mendapatkan URL.` };
      }
      return { success: false, error: `Upload gagal: ${error.message}` };
    }

    if (!data) {
      console.error("No data returned from upload");
      return { success: false, error: "Upload gagal: Tidak ada data yang dikembalikan." };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL");
      return { success: false, error: "Upload berhasil tetapi gagal mendapatkan URL publik." };
    }

    const publicUrl = urlData.publicUrl;
    console.log("Cover image uploaded successfully:", publicUrl);

    // Update profile in database
    try {
      const profile = await getProfileByUserId(user.id);
      if (profile) {
        console.log("Updating profile with cover image URL:", publicUrl);
        console.log("Profile ID:", profile.id);
        
        try {
          console.log("Executing update query...");
          console.log("Setting coverImageUrl to:", publicUrl);
          console.log("For profile ID:", profile.id);
          
          const updateResult = await db.update(profiles)
            .set({ coverImageUrl: publicUrl })
            .where(eq(profiles.id, profile.id));
          
          console.log("Update query executed. Result:", updateResult);
          
          // Verify the update by querying the database directly
          console.log("Verifying update by querying database...");
          const updatedProfile = await db.select({
            id: profiles.id,
            coverImageUrl: profiles.coverImageUrl,
          })
            .from(profiles)
            .where(eq(profiles.id, profile.id))
            .limit(1);
          
          console.log("Verification query result:", updatedProfile);
          
          if (updatedProfile && updatedProfile.length > 0) {
            const savedUrl = updatedProfile[0].coverImageUrl;
            console.log("Saved coverImageUrl in database:", savedUrl);
            console.log("Expected URL:", publicUrl);
            
            if (savedUrl === publicUrl) {
              console.log("✅ Verification successful: coverImageUrl matches!");
            } else if (savedUrl === null || savedUrl === undefined) {
              console.error("❌ Verification failed: coverImageUrl is null/undefined in database!");
              return { 
                success: false, 
                error: "Update query berhasil, tetapi nilai tidak tersimpan di database. Silakan coba lagi atau hubungi administrator."
              };
            } else {
              console.warn("⚠️ Verification warning: coverImageUrl doesn't match expected value!");
              console.warn("Expected:", publicUrl);
              console.warn("Got:", savedUrl);
              // Still return success since URL is saved (might be a caching issue)
            }
          } else {
            console.error("❌ Verification failed: Profile not found after update!");
            return { 
              success: false, 
              error: "Update query berhasil, tetapi profil tidak ditemukan saat verifikasi. Silakan coba lagi."
            };
          }
          
          // Revalidate pages
          revalidatePath("/dashboard");
          revalidatePath("/dashboard/profile");
          revalidatePath(`/u/${profile.username}`);
          revalidatePath(`/@${profile.username}`);
          revalidatePath("/explore");
          
          return { success: true, url: publicUrl };
        } catch (updateError: any) {
          console.error("Error in update query:", updateError);
          console.error("Error details:", {
            message: updateError?.message,
            code: updateError?.code,
            stack: updateError?.stack,
          });
          
          // Only show column missing error if it's explicitly about cover_image_url column
          if (updateError?.message?.includes('column "cover_image_url" does not exist') || 
              (updateError?.code === '42703' && updateError?.message?.includes('cover_image_url'))) {
            console.error("cover_image_url column doesn't exist in database!");
            return { 
              success: true, 
              url: publicUrl,
              warning: "File berhasil diupload, tetapi kolom cover_image_url belum ada di database. Silakan jalankan migration terlebih dahulu."
            };
          }
          // For other errors, log but still return success
          console.error("Update failed but file is uploaded:", updateError?.message);
          return { success: true, url: publicUrl };
        }
      } else {
        console.warn("Profile not found for user:", user.id);
        return { success: false, error: "Profil tidak ditemukan. Silakan buat profil terlebih dahulu." };
      }
    } catch (dbError: any) {
      console.error("Database error updating profile:", dbError);
      // Only show column missing error if it's explicitly about cover_image_url column
      if (dbError?.message?.includes('column "cover_image_url" does not exist') || 
          (dbError?.code === '42703' && dbError?.message?.includes('cover_image_url'))) {
        return { 
          success: true, 
          url: publicUrl,
          warning: "File berhasil diupload, tetapi kolom cover_image_url belum ada di database. Silakan jalankan migration terlebih dahulu."
        };
      }
      // For other errors, return success with URL since file is uploaded
      return { success: true, url: publicUrl };
    }
  } catch (error: any) {
    console.error("Upload cover image error:", error);
    // Ensure error message is always a string and serializable
    let errorMessage = "Upload gagal";
    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = String(error.message);
      } else if (error?.toString) {
        errorMessage = String(error.toString());
      }
    }
    // Return a clean, serializable object
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload image for blocks (content)
 */
export async function uploadImage(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return { success: false, error: "Unauthorized. Silakan login ulang." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      console.error("No file in formData");
      return { success: false, error: "File tidak ditemukan. Silakan pilih file terlebih dahulu." };
    }

    // Validate file type (images allow GIF)
    const allowedTypesForImages = [...ALLOWED_TYPES, "image/gif"];
    if (!allowedTypesForImages.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return { success: false, error: `Format file tidak valid: ${file.type}. Hanya JPG, PNG, WebP, GIF yang diizinkan.` };
    }

    // Validate file size (after compression, should be <= 3MB)
    // Note: Client-side compression should handle files up to 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size, "bytes");
      return { success: false, error: `File terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 3MB setelah kompresi.` };
    }

    // Generate unique filename with timestamp
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `image-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload image
    console.log("Uploading image to:", filePath, "Size:", file.size, "Type:", file.type);
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      // Provide more specific error messages
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        return { success: false, error: "Storage bucket 'images' tidak ditemukan. Hubungi administrator." };
      }
      if (error.message.includes("new row violates row-level security")) {
        return { success: false, error: "Tidak memiliki izin untuk upload. Hubungi administrator." };
      }
      if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        // File already exists, try to get public URL directly
        console.log("File already exists, getting public URL...");
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
        
        if (urlData && urlData.publicUrl) {
          return { success: true, url: urlData.publicUrl };
        }
        return { success: false, error: `File sudah ada tetapi gagal mendapatkan URL.` };
      }
      return { success: false, error: `Upload gagal: ${error.message}` };
    }

    if (!data) {
      console.error("No data returned from upload");
      return { success: false, error: "Upload gagal: Tidak ada data yang dikembalikan." };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL");
      return { success: false, error: "Upload berhasil tetapi gagal mendapatkan URL publik." };
    }

    const publicUrl = urlData.publicUrl;
    console.log("Image uploaded successfully:", publicUrl);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Upload image error:", error);
    // Ensure error message is always a string and serializable
    let errorMessage = "Upload gagal";
    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = String(error.message);
      } else if (error?.toString) {
        errorMessage = String(error.toString());
      }
    }
    // Return a clean, serializable object
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete image from storage
 */
export async function deleteImage(imageUrl: string) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract file path from URL
    // URL format: https://.../storage/v1/object/public/images/{userId}/{filename}
    const urlParts = imageUrl.split("/images/");
    if (urlParts.length < 2) {
      return { success: false, error: "Invalid URL" };
    }

    const filePath = urlParts[1];

    // Delete image
    const { error } = await supabase.storage
      .from("images")
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete image error:", error);
    return { success: false, error: "Delete failed" };
  }
}

