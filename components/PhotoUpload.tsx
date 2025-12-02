"use client";

import { useId, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Camera, Upload } from "lucide-react";

interface PhotoUploadProps {
  routineId?: string;
  routineProductId?: string;
  type: "before" | "after";
  onUploadSuccess?: () => void | Promise<void>;
  label?: string;
  buttonLabel?: string;
  inputId?: string;
  enableNotes?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  maxNoteLength?: number;
}

export default function PhotoUpload({
  routineId,
  routineProductId,
  type,
  onUploadSuccess,
  label,
  buttonLabel,
  inputId,
  enableNotes = false,
  noteLabel,
  notePlaceholder,
  maxNoteLength = 500,
}: PhotoUploadProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('upload');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      if (routineProductId) {
        formData.append("routineProductId", routineProductId);
      }
      const trimmedNote = note.trim();
      if (enableNotes && trimmedNote) {
        formData.append("note", trimmedNote);
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
      setNote("");
      if (onUploadSuccess) {
        await onUploadSuccess();
      }
    } catch (error: any) {
      setError(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("No camera found on this device.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError("Unable to access camera. Please try file upload instead.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        setFile(capturedFile);
        setPreview(canvas.toDataURL('image/jpeg', 0.95));
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera when switching away from camera mode
  useEffect(() => {
    if (captureMode !== 'camera') {
      stopCamera();
    }
  }, [captureMode]);

  // Check if camera is supported
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle - only show if camera is supported */}
      {isCameraSupported() && (
        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <button
            type="button"
            onClick={() => setCaptureMode('upload')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              captureMode === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => {
              setCaptureMode('camera');
              if (!stream) startCamera();
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              captureMode === 'camera'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>
      )}

      {/* Upload Mode Interface */}
      {captureMode === 'upload' && (
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
      )}

      {/* Camera Mode Interface */}
      {captureMode === 'camera' && !preview && (
        <div className="space-y-4">
          {cameraError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="mb-2">{cameraError}</p>
              <button
                type="button"
                onClick={() => setCaptureMode('upload')}
                className="text-sm underline hover:no-underline"
              >
                Switch to file upload
              </button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 object-cover"
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-white text-sm">Starting camera...</div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={!stream}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>
            </>
          )}
        </div>
      )}

      {/* Preview after camera capture */}
      {captureMode === 'camera' && preview && (
        <div className="border-2 border-gray-300 rounded-lg p-6 text-center">
          <img
            src={preview}
            alt="Captured photo"
            className="max-w-full max-h-64 rounded-lg mb-4 mx-auto"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setFile(null);
              startCamera();
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 underline"
          >
            Retake photo
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {enableNotes && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {noteLabel ?? "Add a note"}
          </label>
          <textarea
            value={note}
            onChange={(e) => {
              if (e.target.value.length <= maxNoteLength) {
                setNote(e.target.value);
              }
            }}
            placeholder={notePlaceholder ?? "How's your skin this week?"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            rows={3}
          />
          <div className="text-right text-xs text-gray-500">
            {note.length}/{maxNoteLength} characters
          </div>
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
