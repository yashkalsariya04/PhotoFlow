
import React, { useRef, useState, useCallback } from 'react';
import { Camera, Scan, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const FaceEnrollment: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    setError(null);
    setSuccess(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
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
      setIsCameraActive(false);
    }
  }, [stream]);

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
      
      setSuccess(true);
      toast({
        title: 'Enrollment Successful',
        description: 'Your face has been enrolled for recognition login.',
      });
      stopCamera();
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

  return (
    <Card className="bg-slate-950/80 border-slate-800/80 text-slate-200 rounded-2xl shadow-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-indigo-400" />
          Face Recognition Enrollment
        </CardTitle>
        <CardDescription>
          Enroll your face to enable secure, passwordless login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCameraActive && !success && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-slate-400 mb-6 text-center max-w-xs">
              Click the button below to start the enrollment process.
            </p>
            <Button onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-700">
              Start Enrollment
            </Button>
          </div>
        )}

        {isCameraActive && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-indigo-500/30 rounded-[80px] flex items-center justify-center" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={stopCamera} 
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={captureAndEnroll} 
                disabled={isCapturing}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Capture & Enroll
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center justify-center py-12 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-1">Face Enrolled!</h3>
            <p className="text-slate-400 text-center max-w-xs mb-6">
              You can now use face recognition to sign in to your account.
            </p>
            <Button variant="outline" onClick={startCamera} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              Update Face Data
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
