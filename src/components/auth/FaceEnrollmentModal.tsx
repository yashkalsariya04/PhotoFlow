
import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, Scan, AlertCircle, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const { toast } = useToast();

  const startCamera = async () => {
    setError(null);
    setIsSuccess(false);
    setMode('camera');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted permission.');
      setMode('upload');
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
    // Reset state after a delay to allow animation to finish
    setTimeout(() => {
      setIsSuccess(false);
      setError(null);
      setMode('camera');
    }, 300);
  };

  const enrollWithFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    setError(null);

    try {
      await api.enrollFace(file);
      
      setIsSuccess(true);
      toast({
        title: 'Face Enrolled!',
        description: 'You can now use face recognition to login.',
      });

      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enroll face';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Enrollment Failed',
        description: errorMessage,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const captureAndEnroll = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      );

      if (!blob) throw new Error('Failed to capture image');

      await api.enrollFace(blob);
      
      // Permanently remember face login preference on this device
      localStorage.setItem('prefer_face_login', 'true');

      setIsSuccess(true);
      toast({
        title: 'Face Enrolled!',
        description: 'You can now use face recognition to login.',
      });

      if (onSuccess) onSuccess();
      
      // Close after showing success state
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enroll face';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Enrollment Failed',
        description: errorMessage,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

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
                <h2 className="text-lg font-semibold text-slate-100">Enroll Your Face</h2>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Camera Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center group">
              {isSuccess ? (
                <div className="text-center p-6 space-y-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-100">Enrollment Successful!</h3>
                  <p className="text-slate-400">Your face has been securely scanned and enrolled.</p>
                </div>
              ) : mode === 'upload' ? (
                <div className="text-center p-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Upload className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-100">Upload a Photo</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">
                      Choose a clear, front-facing photo of yourself. 
                      Ensure your face is well-lit and not covered.
                    </p>
                  </div>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="gradient-primary h-12 px-8 rounded-xl"
                    disabled={isCapturing}
                  >
                    {isCapturing ? <Loader2 className="animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                    Select Photo
                  </Button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={enrollWithFile}
                  />
                  <button 
                    onClick={() => { setMode('camera'); startCamera(); }}
                    className="block mx-auto text-sm text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Use Camera Instead
                  </button>
                </div>
              ) : error ? (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-slate-300 max-w-xs mx-auto">{error}</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={startCamera}>Try Camera Again</Button>
                    <Button variant="ghost" onClick={() => setMode('upload')}>Upload Photo Instead</Button>
                  </div>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover mirror"
                  />
                  
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-indigo-500/30 rounded-[100px] flex items-center justify-center relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-4">
                        <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-indigo-500/20">
                          Align Face
                        </span>
                      </div>
                      
                      {/* Scanning Animation Line */}
                      <motion.div 
                        animate={{ top: ['10%', '90%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10"
                      />
                    </div>
                  </div>

                  {/* Switch to Upload Button */}
                  <button 
                    onClick={() => { stopCamera(); setMode('upload'); }}
                    className="absolute bottom-4 right-4 p-2 bg-slate-900/80 rounded-lg text-slate-300 hover:text-white border border-slate-700 backdrop-blur-sm transition-all"
                    title="Upload Photo Instead"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Hidden Canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Footer */}
            {!isSuccess && mode === 'camera' && !error && (
              <div className="p-6 bg-slate-900/50 space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  We use AI to generate a mathematical representation of your face. 
                  The image itself is not stored.
                </div>
                
                <Button 
                  onClick={captureAndEnroll} 
                  disabled={!stream || isCapturing}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Face...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Scan My Face
                    </>
                  )}
                </Button>
                
                <p className="text-center text-xs text-slate-500">
                  Ensure you are in a well-lit area and looking directly at the camera.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
