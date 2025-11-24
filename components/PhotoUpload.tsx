"use client";

import { useId, useState } from "react";
import { useSession } from "next-auth/react";

interface PhotoUploadProps {
  routineId?: string;
  type: "before" | "after";
  onUploadSuccess?: () => void | Promise<void>;
  label?: string;
  buttonLabel?: string;
  inputId?: string;
}

export default function PhotoUpload({
  routineId,
  type,
  onUploadSuccess,
  label,
  buttonLabel,
  inputId,
}: PhotoUploadProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const generatedInputId = useId();
  const uploadInputId = inputId ?? generatedInputId;
  const selectorLabel = label ?? `Select ${type} photo`;
  const uploadButtonLabel = buttonLabel ?? `Upload ${type} photo`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setFile(selectedFile);
      setError("");
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !session) {
      setError("Please select a file and ensure you're logged in");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (routineId) {
        formData.append("routineId", routineId);
      }

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Reset form
      setFile(null);
      setPreview(null);
      if (onUploadSuccess) {
        await onUploadSuccess();
      }
    } catch (error: any) {
      setError(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={uploadInputId}
          disabled={uploading}
        />
        <label
          htmlFor={uploadInputId}
          className="cursor-pointer flex flex-col items-center"
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-64 rounded-lg mb-4"
            />
          ) : (
            <div className="text-gray-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <span className="text-sm text-gray-600">
            {preview ? "Click to change photo" : selectorLabel}
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : uploadButtonLabel}
        </button>
      )}
    </div>
  );
}
