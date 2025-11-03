/**
 * Image upload component with drag-and-drop
 * Extracts math problems from images via GPT-4 Vision
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractProblemFromImage } from '@/lib/api-client';

interface ImageUploadProps {
  onImageExtracted: (text: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 200;
const MAX_DIMENSION = 4000;

export default function ImageUpload({ onImageExtracted }: ImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Validate image file
  const validateImage = async (file: File): Promise<string | null> => {
    // Check file type
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return 'Invalid format (use PNG or JPG)';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'Image too large (max 5MB)';
    }

    // Check dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
          resolve(`Image too small (min ${MIN_DIMENSION}x${MIN_DIMENSION}px)`);
        } else if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          resolve(`Image too large (max ${MAX_DIMENSION}x${MAX_DIMENSION}px)`);
        } else {
          resolve(null); // Valid
        }
      };
      img.onerror = () => resolve('Invalid image file');
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setExtractedText('');
    setIsEditing(false);

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate
    const validationError = await validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Extract text
    setIsExtracting(true);
    try {
      const text = await extractProblemFromImage(file);
      setExtractedText(text);
      setIsEditing(true); // Allow editing by default
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from image');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Handle "Use This Problem" button
  const handleUseProblem = () => {
    if (extractedText.trim()) {
      onImageExtracted(extractedText.trim());
    }
  };

  // Reset to upload new image
  const handleReset = () => {
    setImagePreview(null);
    setExtractedText('');
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Drag-drop area */}
      {!imagePreview && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop image here...</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  Drag & drop an image, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  PNG or JPG, max 5MB, 200-4000px
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          {error.includes('extract') && (
            <p className="mt-2">
              Try uploading a clearer image or{' '}
              <button
                onClick={handleReset}
                className="underline font-medium hover:text-red-800"
              >
                upload a different one
              </button>
              .
            </p>
          )}
        </div>
      )}

      {/* Image preview + extraction */}
      {imagePreview && (
        <div className="space-y-4">
          {/* Preview image */}
          <div className="relative">
            <img
              src={imagePreview}
              alt="Uploaded problem"
              className="max-w-full h-auto rounded-lg border border-gray-300"
              style={{ maxHeight: '300px' }}
            />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Remove
            </button>
          </div>

          {/* Extracting state */}
          {isExtracting && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 font-medium">
                Extracting text from image...
              </span>
            </div>
          )}

          {/* Extracted text (editable) */}
          {extractedText && !isExtracting && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Extracted Problem (you can edit if needed)
                </label>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-lg resize-none ${
                  isEditing
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
                rows={4}
                maxLength={500}
              />
              <button
                onClick={handleUseProblem}
                disabled={!extractedText.trim()}
                className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                  extractedText.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Use This Problem
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
