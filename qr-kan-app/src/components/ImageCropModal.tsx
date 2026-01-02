"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
}

export default function ImageCropModal({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropShape = "round",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Set initial crop area when image loads
  useEffect(() => {
    if (!imageSrc) return;
    
    const handleImageLoad = async () => {
      try {
        const img = await createImage(imageSrc);
        // Set initial crop area to full image
        const initialArea: Area = {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
        };
        setCroppedAreaPixels(initialArea);
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    };
    handleImageLoad();
  }, [imageSrc]);

  const createCroppedImage = async () => {
    if (!imageSrc) {
      console.error("No image source provided");
      return;
    }
    
    setIsProcessing(true);
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // If croppedAreaPixels is not set, use full image
      let cropArea = croppedAreaPixels;
      if (!cropArea) {
        // Use full image as default crop area
        cropArea = {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        };
      }

      // Set canvas size to cropped area
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      // Draw cropped image
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Reset processing state before calling onCropComplete
            // The parent component will handle the upload state
            setIsProcessing(false);
            onCropComplete(blob);
          } else {
            console.error("Failed to create blob");
            setIsProcessing(false);
            alert("Gagal membuat gambar. Silakan coba lagi.");
          }
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Crop error:", error);
      setIsProcessing(false);
      alert("Terjadi kesalahan saat memproses gambar. Silakan coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Crop Image</h3>
          <p className="text-sm text-gray-600 mt-1">
            Adjust the image to fit perfectly
          </p>
        </div>

        {/* Crop Area */}
        <div className="relative h-[400px] bg-gray-100">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteInternal}
            />
          )}
        </div>

        {/* Zoom Control */}
        <div className="px-6 py-4 border-b">
          <label className="text-sm font-medium mb-2 block">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={createCroppedImage}
            disabled={isProcessing}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Crop & Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to create an image element from a URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

