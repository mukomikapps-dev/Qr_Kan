"use client";

import { useState, useRef, useId } from "react";
import ImageCropModal from "./ImageCropModal";
import { uploadImage } from "@/app/dashboard/uploadActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { compressImage, needsCompression } from "@/lib/image-compression";

interface StatusUploadProps {
  onUploadSuccess: (url: string) => void;
  currentStatusUrl?: string | null;
  onRemove?: () => void;
}

export default function StatusUpload({
  onUploadSuccess,
  currentStatusUrl,
  onRemove,
}: StatusUploadProps) {
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
      // Compress image if needed (skip for GIF)
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
      {/* Current Status Preview */}
      {currentStatusUrl && (
        <div className="relative rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="relative aspect-square w-full max-w-[120px] mx-auto">
            <Image
              src={currentStatusUrl}
              alt="Status"
              fill
              className="object-cover rounded-lg"
              sizes="120px"
            />
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition shadow-sm"
              title="Hapus status"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
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
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor={inputId}
          className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition cursor-pointer ${
              isUploading || isCompressing
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
                {currentStatusUrl ? "Ganti Gambar Status" : "Upload Gambar Status"}
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

      {/* Crop Modal */}
      {previewSrc && (
        <ImageCropModal
          imageSrc={previewSrc}
          aspectRatio={1} // Square for status
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}

