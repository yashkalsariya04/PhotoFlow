
import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, Scan, AlertCircle, Loader2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaceLoginModal: React.FC<FaceLoginModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const detectionIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted permission.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleClose = () => {
    stopCamera();
    onClose();
    setTimeout(() => {
      setError(null);
      setCapturedImage(null);
      setIsScanning(false);
      setIsCameraReady(false);
      setIsFaceCentered(false);
    }, 300);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    setIsScanning(false);
    startCamera();
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const size = Math.min(videoWidth, videoHeight);
      const sx = (videoWidth - size) / 2;
      const sy = (videoHeight - size) / 2;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      
      // Stop camera immediately to show the captured frame
      stopCamera();

      // Get blob for API call
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      );

      if (!blob) throw new Error('Failed to process captured image');

      const response = await api.faceLogin(blob);
      const user = await login(response.token);

      // Remember face login preference
      localStorage.setItem('prefer_face_login', 'true');

      toast({
        title: 'Success!',
        description: `Welcome back, ${user?.name}!`,
      });

      handleClose();
      
      // Redirect based on role
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Face not recognized';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: errorMessage,
      });
      // Don't clear captured image so user can see what failed, but allow retake
    } finally {
      setIsScanning(false);
    }
  };

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Failed to load faceapi models', err);
    }
  };

  const startDetection = () => {
    if (!videoRef.current || !modelsLoaded) return;
    const detect = async () => {
      if (!videoRef.current || !stream) {
        setIsFaceCentered(false);
        return;
      }
      try {
        // Try TinyFaceDetector first (fast), then fall back to SSD Mobilenet (more accurate)
        let detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
        );
        if (!detection) {
          detection = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 })
          ) as any;
        }
        if (detection) {
          const { x, width } = detection.box;
          const video = videoRef.current;
          const videoWidth = video.videoWidth;
          const faceCenterX = x + width / 2;
          const screenCenterX = videoWidth / 2;
          const distance = Math.abs(faceCenterX - screenCenterX);
          const isCentered = distance < videoWidth * 0.2 && width > videoWidth * 0.18;
          setIsFaceCentered(isCentered);
        } else {
          setIsFaceCentered(false);
        }
      } catch (e) {
        console.error('Detection error', e);
      }
      detectionIntervalRef.current = requestAnimationFrame(detect);
    };
    detect();
  };

  React.useEffect(() => {
    if (isOpen) {
      loadModels();
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  React.useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      setIsCameraReady(true);
      video.play().catch(() => {});
      startDetection();
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (detectionIntervalRef.current) cancelAnimationFrame(detectionIntervalRef.current);
    };
  }, [stream, modelsLoaded]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Scan className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">Face Recognition Login</h2>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Camera Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
              {error && !capturedImage ? (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-slate-300 max-w-xs mx-auto">{error}</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={handleRetake}>Try Again</Button>
                  </div>
                </div>
              ) : (
                <>
                  {capturedImage ? (
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className={`relative mx-auto w-64 h-64 rounded-full overflow-hidden border-4 shadow-2xl bg-black ${error ? 'border-red-500/80' : 'border-indigo-500/80'}`}>
                        <img
                          src={capturedImage}
                          alt="Captured"
                          className="w-full h-full object-contain"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
                      </div>
                      {error ? (
                        <p className="text-xs font-medium text-red-400">Capture failed, try again</p>
                      ) : (
                        <p className="text-xs font-medium text-slate-400">Review your photo and continue</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className={`relative mx-auto w-64 h-64 rounded-full overflow-hidden border-4 shadow-2xl bg-black transition-colors duration-300 ${isFaceCentered ? 'border-green-500 ring-4 ring-green-500/20' : 'border-indigo-500/80'}`}>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`w-48 h-48 rounded-full border-2 border-dashed transition-all duration-300 ${isFaceCentered ? 'border-green-400/50 scale-110' : 'border-white/20'}`} />
                          <Target className={`absolute w-8 h-8 transition-all duration-300 ${isFaceCentered ? 'text-green-500 scale-125 opacity-100' : 'text-white/20 opacity-40'}`} />
                        </div>
                      </div>
                      <p className={`text-xs font-medium transition-colors duration-300 ${isFaceCentered ? 'text-green-400' : 'text-slate-400'}`}>
                        {isFaceCentered ? 'Perfect! Hold still and capture.' : 'Align your face inside the circle.'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Hidden Canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Footer */}
            {!error && (
              <div className="p-6 bg-slate-900/50 space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-indigo-500 animate-ping' : 'bg-indigo-500 animate-pulse'}`} />
                  {isScanning 
                    ? 'Verifying biometric patterns...' 
                    : 'Your biometric data is processed securely and never stored as raw images.'}
                </div>
                
                <Button 
                  onClick={handleCapture} 
                  disabled={!isFaceCentered || !isCameraReady || isScanning}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Capture & Login
                    </>
                  )}
                </Button>
                
                <p className="text-center text-xs text-slate-500">
                  Position your face within the guide and click the button to login.
                </p>
              </div>
            )}

            {/* Error State with Retake */}
            {error && (
              <div className="p-6 bg-slate-900/50 space-y-4">
                <div className="flex items-center gap-3 text-sm text-red-400 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
                <Button 
                  onClick={handleRetake}
                  className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
                >
                  Try Again
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
