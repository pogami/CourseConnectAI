"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, X, FlipHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      // Clear any existing stream
      const currentStream = stream;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setError(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera access denied. Please enable camera permissions in your browser settings to use the live webcam.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera. Please ensure no other app is using it.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Handle attaching the stream to the video element separately
  useEffect(() => {
    if (stream && videoRef.current && !capturedImage) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const handlePlay = async () => {
        try {
          // Use requestAnimationFrame to ensure the browser is ready to play
          window.requestAnimationFrame(async () => {
            if (video.srcObject) {
              await video.play();
              console.log("🎥 Video playing successfully");
            }
          });
        } catch (err) {
          console.error("🎥 Video play failed:", err);
        }
      };

      video.onloadedmetadata = handlePlay;
    }
  }, [stream, capturedImage]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isOpen && !capturedImage) {
      // Small delay to ensure the video element is fully mounted in the DOM
      // before we try to attach the camera stream to it
      timeoutId = setTimeout(() => {
        startCamera();
      }, 100);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, capturedImage, startCamera]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const confirm = () => {
    if (capturedImage) {
      // Convert data URL to File object
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          handleClose();
        });
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  useEffect(() => {
    if (isOpen && videoRef.current && stream && !capturedImage) {
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, stream, capturedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-zinc-950 border-zinc-800 rounded-[2rem] shadow-2xl">
        <div className="relative flex flex-col w-full bg-zinc-950">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex flex-col">
              <DialogTitle className="text-white text-lg font-bold">Live Camera</DialogTitle>
              <p className="text-zinc-400 text-xs">Position your notes clearly in the frame</p>
            </div>
            <Button 
              onClick={handleClose} 
              variant="ghost" 
              className="h-10 w-10 rounded-full p-0 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Camera Viewport */}
          <div className="relative aspect-video sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-300"
              />
            ) : (
              <>
                {error ? (
                  <div className="p-8 text-center text-white flex flex-col items-center gap-4 max-w-sm">
                    <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                      <X className="h-7 w-7 text-red-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-red-400">Camera Access Error</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full mt-4">
                      <Button onClick={startCamera} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl">
                        Retry Access
                      </Button>
                      <Button 
                        onClick={() => {
                          handleClose();
                          const fileInput = document.querySelector('input[capture="environment"]') as HTMLInputElement;
                          if (fileInput) fileInput.click();
                        }} 
                        variant="outline" 
                        className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-11 rounded-xl"
                      >
                        Use System Camera
                      </Button>
                    </div>
                  </div>
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                    onCanPlay={(e) => {
                      (e.target as HTMLVideoElement).play().catch(console.error);
                    }}
                  />
                )}
              </>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Bottom Controls */}
          <div className="p-8 bg-zinc-950 border-t border-zinc-900/50 flex items-center justify-center gap-12">
            {!capturedImage ? (
              <>
                <div className="w-12 h-12" /> {/* Spacer */}
                
                <button 
                  onClick={capture}
                  disabled={!!error || !stream}
                  className={cn(
                    "group relative h-20 w-20 rounded-full bg-white flex items-center justify-center transition-all shadow-2xl active:scale-90",
                    (!!error || !stream) && "opacity-20 cursor-not-allowed grayscale"
                  )}
                >
                  <div className="h-16 w-16 rounded-full border-[3px] border-zinc-950 transition-transform group-hover:scale-95" />
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-pulse" />
                </button>

                <Button 
                  onClick={toggleCamera} 
                  variant="ghost" 
                  disabled={!!error}
                  className="h-12 w-12 rounded-full p-0 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-500"
                  title="Switch Camera"
                >
                  <FlipHorizontal className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full max-w-xs">
                <Button 
                  onClick={retake} 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2 font-bold"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>

                <Button 
                  onClick={confirm} 
                  className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 font-black shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                >
                  <Check className="h-5 w-5" />
                  Use Photo
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

