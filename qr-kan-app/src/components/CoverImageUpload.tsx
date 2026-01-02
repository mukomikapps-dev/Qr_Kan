"use client";

import { useState, useRef, useId } from "react";
import ImageCropModal from "./ImageCropModal";
import { uploadCoverImage } from "@/app/dashboard/uploadActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { compressImage, needsCompression } from "@/lib/image-compression";

interface CoverImageUploadProps {
  onUploadSuccess: (url: string) => void;
  currentCoverImageUrl?: string | null;
  onRemove?: () => void;
}

export default function CoverImageUpload({
  onUploadSuccess,
  currentCoverImageUrl,
  onRemove,
}: CoverImageUploadProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format file tidak valid. Gunakan JPG, PNG, atau WebP.");
      return;
    }

    // Validate file size (10MB for HD, will be compressed)
    const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_INPUT_SIZE) {
      setError("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setIsCompressing(false);
    setError(null);

    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], "cover.jpg", { type: croppedBlob.type || "image/jpeg" });
      
      // Compress image if needed (for HD images)
      let fileToUpload = croppedFile;
      if (needsCompression(croppedFile, 2)) {
        setIsCompressing(true);
        try {
          fileToUpload = await compressImage(croppedFile, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920, // HD resolution
            fileType: croppedFile.type,
          });
        } catch (compressError) {
          console.error("Compression error:", compressError);
          // Continue with original file if compression fails
        } finally {
          setIsCompressing(false);
        }
      }

      // Create FormData and upload
      const formData = new FormData();
      formData.append("file", fileToUpload, "cover.jpg");

      console.log("Starting cover image upload...");
      let result;
      
      // Add timeout to prevent hanging
      const uploadPromise = uploadCoverImage(formData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timeout. Silakan coba lagi.")), 60000); // 60 seconds timeout
      });
      
      try {
        result = await Promise.race([uploadPromise, timeoutPromise]) as any;
        console.log("Upload result:", result);
      } catch (uploadErr: any) {
        console.error("Upload function error:", uploadErr);
        // If uploadCoverImage throws an error, wrap it in result format
        result = {
          success: false,
          error: uploadErr?.message || "Terjadi kesalahan saat memanggil server. Silakan coba lagi.",
        };
      }

      // Handle result
      if (result && result.success && result.url) {
        console.log("Upload successful:", result.url);
        // Close modal only on success
        setPreviewSrc(null);
        onUploadSuccess(result.url);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Clear any previous errors
        setError(null);
        
        // Show warning if there's a warning message (e.g., column doesn't exist)
        if (result.warning) {
          console.warn("Upload warning:", result.warning);
          setError(result.warning);
        }
        
        // Also try to save directly via debug endpoint as fallback
        try {
          console.log("Attempting direct save via debug endpoint...");
          const debugResponse = await fetch("/api/debug/cover-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImageUrl: result.url }),
          });
          const debugResult = await debugResponse.json();
          console.log("Debug endpoint result:", debugResult);
          if (debugResult.success && debugResult.updated) {
            console.log("✅ Cover image saved successfully via debug endpoint!");
          } else {
            console.warn("⚠️ Debug endpoint update may have failed:", debugResult);
          }
        } catch (debugError) {
          console.warn("Debug endpoint call failed (non-critical):", debugError);
        }
      } else {
        const errorMsg = result?.error || "Upload gagal. Silakan coba lagi.";
        setError(errorMsg);
        console.error("Upload failed:", result);
        // If URL is provided even on error (e.g., file uploaded but DB save failed), still call onUploadSuccess
        if (result?.url) {
          onUploadSuccess(result.url);
          console.warn("File uploaded but database save failed. URL:", result.url);
        }
        // Keep modal open so user can try again
      }
    } catch (err: any) {
      console.error("Unexpected error in handleCropComplete:", err);
      const errorMsg = err?.message || "Terjadi kesalahan saat upload. Silakan coba lagi.";
      setError(errorMsg);
    } finally {
      // Always reset uploading state, no matter what happens
      console.log("Resetting upload state");
      setIsUploading(false);
      setIsCompressing(false);
    }
  };

  const handleCancelCrop = () => {
    setPreviewSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Cover Image Preview */}
      {currentCoverImageUrl && (
        <div className="relative rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden">
          <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
            <Image
              src={currentCoverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 400px"
            />
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600 transition shadow-lg"
              title="Hapus cover image"
            >
              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          type="file"
          id={inputId}
          ref={fileInputRef}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor={inputId}
          className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition cursor-pointer ${
            isUploading
              ? "border-zinc-300 bg-zinc-100 cursor-not-allowed"
              : "border-zinc-300 bg-white hover:border-emerald-500 hover:bg-emerald-50"
          }`}
        >
          {isUploading || isCompressing ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin text-zinc-500" />
              <span className="text-zinc-500">
                {isCompressing ? "Mengompres..." : "Mengupload..."}
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faImage} className="h-4 w-4 text-emerald-600" />
              <span className="text-zinc-700">
                {currentCoverImageUrl ? "Ganti Cover Image" : "Upload Cover Image"}
              </span>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-zinc-500">
        Cover image akan ditampilkan di halaman explore. Rasio 3:4 (portrait). Maksimal 10MB (akan di-compress otomatis).
      </p>

      {/* Crop Modal */}
      {previewSrc && (
        <ImageCropModal
          imageSrc={previewSrc}
          aspectRatio={3 / 4} // 3:4 portrait
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}

