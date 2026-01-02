"use client";

import { useState, useRef } from "react";
import ImageCropModal from "./ImageCropModal";
import { uploadLogo } from "@/app/dashboard/uploadActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { compressImage, needsCompression } from "@/lib/image-compression";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export default function LogoUpload({
  currentLogoUrl,
  onUploadSuccess,
}: LogoUploadProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      setError("Format file tidak valid. Gunakan JPG, PNG, WebP, atau SVG.");
      return;
    }

    // Validate file size (10MB for HD, will be compressed, SVG can be larger)
    const MAX_INPUT_SIZE = file.type === "image/svg+xml" ? 2 * 1024 * 1024 : 10 * 1024 * 1024; // SVG: 2MB, others: 10MB
    if (file.size > MAX_INPUT_SIZE) {
      setError(`Ukuran file terlalu besar. Maksimal ${file.type === "image/svg+xml" ? "2MB" : "10MB"}.`);
      return;
    }

    // If SVG, upload directly without crop
    if (file.type === "image/svg+xml") {
      uploadDirectly(file);
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

  const uploadDirectly = async (file: File) => {
    setIsUploading(true);
    setIsCompressing(false);
    setError(null);

    try {
      // Compress image if needed (skip for SVG)
      let fileToUpload = file;
      if (file.type !== "image/svg+xml" && needsCompression(file, 2)) {
        setIsCompressing(true);
        try {
          fileToUpload = await compressImage(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            fileType: file.type,
          });
        } catch (compressError) {
          console.error("Compression error:", compressError);
          // Continue with original file if compression fails
        } finally {
          setIsCompressing(false);
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      console.log("Starting logo upload (direct)...");
      let result;
      
      // Add timeout to prevent hanging
      const uploadPromise = uploadLogo(formData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timeout. Silakan coba lagi.")), 60000); // 60 seconds timeout
      });
      
      try {
        result = await Promise.race([uploadPromise, timeoutPromise]) as any;
        console.log("Upload result:", result);
      } catch (uploadErr: any) {
        console.error("Upload function error:", uploadErr);
        // If uploadLogo throws an error, wrap it in result format
        result = {
          success: false,
          error: uploadErr?.message || "Terjadi kesalahan saat memanggil server. Silakan coba lagi.",
        };
      }

      // Handle result
      if (result && result.success && result.url) {
        console.log("Upload successful:", result.url);
        onUploadSuccess?.(result.url);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Clear any previous errors
        setError(null);
      } else {
        const errorMsg = result?.error || "Upload gagal. Silakan coba lagi.";
        setError(errorMsg);
        console.error("Upload failed:", result);
      }
    } catch (err: any) {
      console.error("Unexpected error in uploadDirectly:", err);
      const errorMsg = err?.message || "Terjadi kesalahan saat upload. Silakan coba lagi.";
      setError(errorMsg);
    } finally {
      // Always reset uploading state, no matter what happens
      console.log("Resetting upload state");
      setIsUploading(false);
      setIsCompressing(false);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setIsCompressing(false);
    setError(null);

    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], "logo.jpg", { type: croppedBlob.type || "image/jpeg" });
      
      // Compress image if needed
      let fileToUpload = croppedFile;
      if (needsCompression(croppedFile, 2)) {
        setIsCompressing(true);
        try {
          fileToUpload = await compressImage(croppedFile, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
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
      formData.append("file", fileToUpload, "logo.jpg");

      console.log("Starting logo upload...");
      let result;
      
      // Add timeout to prevent hanging
      const uploadPromise = uploadLogo(formData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timeout. Silakan coba lagi.")), 60000); // 60 seconds timeout
      });
      
      try {
        result = await Promise.race([uploadPromise, timeoutPromise]) as any;
        console.log("Upload result:", result);
      } catch (uploadErr: any) {
        console.error("Upload function error:", uploadErr);
        // If uploadLogo throws an error, wrap it in result format
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
      {/* Current Logo Preview */}
      <div className="flex items-center gap-4">
        <div className="relative bg-gray-100 rounded-lg p-3">
          <img
            src={currentLogoUrl || "/default-logo.svg"}
            alt="Logo"
            className="w-20 h-20 object-contain"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faSpinner} className="text-white animate-spin text-xl" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="logo-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition"
          >
            <FontAwesomeIcon icon={faImage} />
            Upload Logo
          </label>
          <input
            id="logo-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isCompressing}
          />
          <p className="text-xs text-gray-600 mt-2">
            JPG, PNG, WebP, SVG. Max 10MB (akan di-compress otomatis, SVG tetap 2MB). Transparent background recommended.
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
          aspectRatio={4 / 3}
          cropShape="rect"
        />
      )}
    </div>
  );
}

