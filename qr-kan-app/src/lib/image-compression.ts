import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

/**
 * Compress image using Canvas API (fallback)
 * Only works in browser environment
 */
async function compressImageCanvas(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Canvas compression only works in browser');
  }

  const maxSizeMB = options.maxSizeMB || 2;
  const maxWidthOrHeight = options.maxWidthOrHeight || 1920;
  const targetSize = maxSizeMB * 1024 * 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          } else {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to reach target size
        let quality = 0.9;
        const tryCompress = (q: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              if (blob.size <= targetSize || q <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: options.fileType || file.type || 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Reduce quality and try again
                tryCompress(Math.max(0.1, q - 0.1));
              }
            },
            options.fileType || file.type || 'image/jpeg',
            q
          );
        };

        tryCompress(quality);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image file
 * @param file Original image file
 * @param options Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 2, // Target size after compression (2MB)
    maxWidthOrHeight: 1920, // Max dimension for HD images
    useWebWorker: true,
    fileType: file.type,
    ...options,
  };

  // Use browser-image-compression (preferred method)
  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    // Fallback to Canvas API if browser-image-compression fails
    try {
      return await compressImageCanvas(file, defaultOptions);
    } catch (canvasError) {
      console.error('Canvas compression error:', canvasError);
      // If all compression fails, return original file
      // Server will validate size
      return file;
    }
  }
}

/**
 * Check if image needs compression
 * @param file Image file
 * @param maxSizeMB Maximum size in MB before compression
 * @returns true if file needs compression
 */
export function needsCompression(file: File, maxSizeMB: number = 2): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxSizeBytes;
}

