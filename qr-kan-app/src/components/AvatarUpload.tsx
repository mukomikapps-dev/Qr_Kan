"use client";

import { useState, useRef } from "react";
import ImageCropModal from "./ImageCropModal";
import { uploadAvatar } from "@/app/dashboard/uploadActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { compressImage, needsCompression } from "@/lib/image-compression";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: croppedBlob.type || "image/jpeg" });
      
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
      formData.append("file", fileToUpload, "avatar.jpg");

      console.log("Starting avatar upload...");
      let result;
      
      // Add timeout to prevent hanging
      const uploadPromise = uploadAvatar(formData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timeout. Silakan coba lagi.")), 60000); // 60 seconds timeout
      });
      
      try {
        result = await Promise.race([uploadPromise, timeoutPromise]) as any;
        console.log("Upload result:", result);
      } catch (uploadErr: any) {
        console.error("Upload function error:", uploadErr);
        // If uploadAvatar throws an error, wrap it in result format
        result = {
          success: false,
          error: uploadErr?.message || "Terjadi kesalahan saat memanggil server. Silakan coba lagi.",
        };
      }

      // Handle result
      if (result && result.success && result.url) {
        console.log("Upload successful:", result.url);
        setPreviewSrc(null);
        onUploadSuccess?.(result.url);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Clear any previous errors
        setError(null);
      } else {
        const errorMsg = result?.error || "Upload gagal. Silakan coba lagi.";
        setError(errorMsg);
        console.error("Upload failed:", result);
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

  return (
    <div className="space-y-3">
      {/* Current Avatar Preview */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={currentAvatarUrl || "/default-avatar.svg"}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
          />
          {(isUploading || isCompressing) && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faSpinner} className="text-white animate-spin text-xl" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition"
          >
            <FontAwesomeIcon icon={faCamera} />
            Upload Avatar
          </label>
          <input
            id="avatar-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isCompressing}
          />
          <p className="text-xs text-gray-600 mt-2">
            JPG, PNG, WebP. Max 10MB (akan di-compress otomatis). Square recommended.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Crop Modal */}
      {previewSrc && (
        <ImageCropModal
          imageSrc={previewSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </div>
  );
}

