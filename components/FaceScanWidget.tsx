"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";

interface SkinAnalysisResult {
  skinType: 'DRY' | 'OILY' | 'COMBINATION' | 'NORMAL' | 'UNKNOWN';
  confidence: number;
  concerns: {
    wrinkles: number;
    spots: number;
    redness: number;
    acne: number;
    oiliness: number;
    darkCircles: number;
    texture: number;
    moisture: number;
  };
  imageUrl: string;
  analysisDate: Date;
}

interface FaceScanWidgetProps {
  onAnalysisComplete: (result: SkinAnalysisResult) => void;
  onError: (error: Error) => void;
  autoSaveToProfile?: boolean;
}

type WidgetState = 'idle' | 'camera' | 'validating' | 'capturing' | 'analyzing' | 'error';

export default function FaceScanWidget({
  onAnalysisComplete,
  onError,
  autoSaveToProfile = false,
}: FaceScanWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('camera');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
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

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Capture photo from camera
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
        const capturedFile = new File([blob], `face-scan-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        setCapturedImage(capturedFile);
        setPreview(canvas.toDataURL('image/jpeg', 0.95));
        stopCamera();
        setWidgetState('capturing');
      }
    }, 'image/jpeg', 0.95);
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Image file is too large. Maximum size is 10MB.");
        return;
      }

      setCapturedImage(selectedFile);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setWidgetState('capturing');
    }
  };

  // Analyze the captured image
  const handleAnalyze = async () => {
    if (!capturedImage) return;

    // Validate file size
    if (capturedImage.size > 10 * 1024 * 1024) {
      setError('Image too large. Please try again with better compression.');
      setWidgetState('error');
      return;
    }

    setWidgetState('analyzing');
    setError("");

    try {
      const formData = new FormData();
      formData.append('imageFile', capturedImage);
      formData.append('saveToProfile', String(autoSaveToProfile));

      const res = await fetch('/api/skin-analysis', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      onAnalysisComplete(data.analysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setWidgetState('error');
      onError(new Error(errorMessage));
    }
  };

  // Retry capture
  const handleRetry = () => {
    setCapturedImage(null);
    setPreview(null);
    setError("");
    setCameraError("");
    setWidgetState('idle');
    if (captureMode === 'camera') {
      startCamera();
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera when switching to camera mode
  useEffect(() => {
    if (captureMode === 'camera' && widgetState === 'idle' && !stream) {
      startCamera();
    }
  }, [captureMode, widgetState]);

  // Check if camera is supported
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      {isCameraSupported() && widgetState === 'idle' && (
        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <button
            type="button"
            onClick={() => setCaptureMode('camera')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              captureMode === 'camera'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => {
              setCaptureMode('upload');
              stopCamera();
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              captureMode === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      )}

      {/* Upload Mode Interface */}
      {captureMode === 'upload' && widgetState === 'idle' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="face-scan-upload"
          />
          <label
            htmlFor="face-scan-upload"
            className="cursor-pointer flex flex-col items-center"
          >
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
            <span className="text-sm text-gray-600">
              Click to upload a face photo
            </span>
            <span className="text-xs text-gray-500 mt-1">Maximum size: 10MB</span>
          </label>
        </div>
      )}

      {/* Camera Mode Interface */}
      {captureMode === 'camera' && widgetState === 'idle' && !preview && (
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

      {/* Preview and Analyze */}
      {preview && widgetState === 'capturing' && (
        <div className="space-y-4">
          <div className="border-2 border-gray-300 rounded-lg p-6 text-center">
            <img
              src={preview}
              alt="Captured photo"
              className="max-w-full max-h-64 rounded-lg mb-4 mx-auto"
            />
            <button
              type="button"
              onClick={handleRetry}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              Retake photo
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Analyze My Skin
          </button>
        </div>
      )}

      {/* Analyzing State */}
      {widgetState === 'analyzing' && (
        <div className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-indigo-600 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analyzing your skin...
          </h3>
          <p className="text-sm text-gray-600">
            This may take 15-30 seconds. Please wait while we analyze your skin type and concerns.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && widgetState === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium mb-1">Analysis Failed</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
