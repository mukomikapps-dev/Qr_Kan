"use client";

import { useState, useRef, useId } from "react";
import ImageCropModal from "./ImageCropModal";
import { uploadImage } from "@/app/dashboard/uploadActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import { compressImage, needsCompression } from "@/lib/image-compression";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  onRemove?: () => void;
  aspectRatio?: number;
}

export default function ImageUpload({
  onUploadSuccess,
  currentImageUrl,
  onRemove,
  aspectRatio = 16 / 9,
}: ImageUploadProps) {
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
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Format file tidak valid. Gunakan JPG, PNG, WebP, atau GIF.");
      return;
    }

    // Validate file size (10MB for HD, will be compressed)
    const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_INPUT_SIZE) {
      setError("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    // If GIF, upload directly without crop
    if (file.type === "image/gif") {
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
    setError(null);

    try {
      // Compress image if needed (for HD images, skip for GIF)
      let fileToUpload = file;
      if (file.type !== "image/gif" && needsCompression(file, 2)) {
        setIsCompressing(true);
        try {
          fileToUpload = await compressImage(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            fileType: file.type,
          });
        } catch (compressError) {
          console.error("Compression error:", compressError);
        } finally {
          setIsCompressing(false);
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const result = await uploadImage(formData);

      if (result.success && result.url) {
        onUploadSuccess(result.url);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setError(result.error || "Upload gagal");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat upload");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], "image.jpg", { type: croppedBlob.type || "image/jpeg" });
      
      // Compress image if needed (for HD images)
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
        } finally {
          setIsCompressing(false);
        }
      }

      // Create FormData and upload
      const formData = new FormData();
      formData.append("file", fileToUpload, "image.jpg");

      const result = await uploadImage(formData);

      if (result.success && result.url) {
        // Close modal only on success
        setPreviewSrc(null);
        onUploadSuccess(result.url);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsUploading(false);
      } else {
        setError(result.error || "Upload gagal");
        setIsUploading(false);
        // Keep modal open on error so user can try again
      }
    } catch (err) {
      setError("Terjadi kesalahan saat upload");
      console.error(err);
      setIsUploading(false);
      // Keep modal open on error so user can try again
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
      {/* Current Image Preview (if exists) */}
      {currentImageUrl && (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Current"
            className="w-full max-w-md rounded-lg border-2 border-gray-200"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading || isCompressing ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              {isCompressing ? "Mengompres..." : "Mengupload..."}
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faImage} />
              {currentImageUrl ? "Change Image" : "Upload Image"}
            </>
          )}
        </label>
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || isCompressing}
        />
        <p className="text-xs text-gray-600 mt-2">
          JPG, PNG, WebP, GIF. Max 2MB.
        </p>
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
          aspectRatio={aspectRatio}
          cropShape="rect"
        />
      )}
    </div>
  );
}

