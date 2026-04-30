import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// folder is kept as a parameter for API compatibility with the previous
// Supabase-bucket-based upload hook. Convex stores files in one logical
// pool, so the folder is informational only.
export const useImageUpload = (_folder: string = 'menu-images') => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const finalizeUpload = useMutation(api.storage.finalizeUpload);

  const uploadImage = async (file: File): Promise<string> => {
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      setUploading(true);
      setUploadProgress(0);

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = [
        'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif',
        'svg', 'heic', 'heif', 'ico', 'avif', 'jfif',
      ];
      const hasValidExtension = !!fileExtension && validExtensions.includes(fileExtension);
      const hasValidMimeType = !file.type || file.type.startsWith('image/');

      if (!hasValidExtension && !hasValidMimeType) {
        throw new Error(
          `Please upload a valid image file. Supported formats: JPG, PNG, WebP, GIF, BMP, TIFF, SVG, HEIC, and more. File type: ${
            file.type || 'unknown'
          }, Extension: ${fileExtension || 'none'}`,
        );
      }

      let contentType = file.type;
      if (!contentType && hasValidExtension) {
        const mimeMap: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg',
          png: 'image/png', webp: 'image/webp', gif: 'image/gif',
          bmp: 'image/bmp', tiff: 'image/tiff', tif: 'image/tiff',
          svg: 'image/svg+xml', heic: 'image/heic', heif: 'image/heif',
          ico: 'image/x-icon', avif: 'image/avif',
        };
        contentType = mimeMap[fileExtension!] || 'image/jpeg';
      }

      if (file.size < 100) {
        throw new Error('The selected file appears to be invalid or empty. Please select a valid image.');
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`Image size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }

      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': contentType || 'image/jpeg' },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed (HTTP ${result.status})`);
      }
      const { storageId } = (await result.json()) as { storageId: string };
      const finalized = await finalizeUpload({ storageId });

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);
      return finalized.url;
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImage = async (_imageUrl: string): Promise<void> => {
    // No-op: we can't reliably reverse a Convex public URL back to a
    // storageId without a lookup table. Unreferenced files remain until
    // manually purged.
    return;
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    uploadProgress,
  };
};
