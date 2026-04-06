import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, Calendar, MapPin, Loader2, Sparkles, Scan, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, X, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as faceapi from 'face-api.js';

interface Event {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  accessCode?: string;
  photoCount: number;
  clientAccessCount?: number;
}

export default function ClientEventAccess() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [detectionTimedOut, setDetectionTimedOut] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const detectionTimeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const [familyPins, setFamilyPins] = useState<string[]>([]);
  const [clientPinInput, setClientPinInput] = useState('');
  const [clientPinValidated, setClientPinValidated] = useState(false);
  const [eventPhotos, setEventPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [mode, setMode] = useState<'face' | 'pin' | 'ghibli'>('face');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectionMode = () => {
    setSelectedPhotoIds([]);
    setIsSelectionMode((s) => !s);
  };

  const toggleSelectAll = () => {
    if (!eventPhotos || eventPhotos.length === 0) return;
    setSelectedPhotoIds((prev) => (prev.length === eventPhotos.length ? [] : eventPhotos.map((p) => p._id || p.id)));
  };

  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') closeGallery();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen, galleryIndex, eventPhotos]);

  const openGalleryAt = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const closeGallery = () => setGalleryOpen(false);

  const prevPhoto = () => setGalleryIndex((i) => (eventPhotos.length ? (i - 1 + eventPhotos.length) % eventPhotos.length : 0));
  const nextPhoto = () => setGalleryIndex((i) => (eventPhotos.length ? (i + 1) % eventPhotos.length : 0));
  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
      return [...prev, photoId];
    });
  };

  const downloadSelectedPhotos = async () => {
    if (!selectedPhotoIds || selectedPhotoIds.length === 0) return;
    const photosToDownload = eventPhotos.filter((p) => selectedPhotoIds.includes(p._id || p.id));
    if (photosToDownload.length === 0) return;
    toast({ title: 'Starting download', description: `Downloading ${photosToDownload.length} photos` });
    for (const photo of photosToDownload) {
      try {
        const url = api.getPublicPhotoUrl(photo._id || photo.id);
        const resp = await fetch(url);
        const blob = await resp.blob();
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = photo.filename || `${photo._id}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error('Download failed for photo', photo, e);
      }
    }
    toast({ title: 'Downloads started', description: 'Your browser may prompt for multiple downloads' });
  };

  useEffect(() => {
    loadEvent();
    loadModels();
  }, [accessCode]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionIntervalRef.current) {
        cancelAnimationFrame(detectionIntervalRef.current);
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      // Load tiny face detector for fast real-time centering check
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Failed to load faceapi models', err);
      // Allow capture without face detection if models fail to load
      setModelsLoaded(false);
      setDetectionTimedOut(true); // Show "Capture anyway" immediately
    }
  };

  const startDetection = async () => {
    if (!videoRef.current) {
      if (isCameraOpen) {
        setTimeout(startDetection, 500);
      }
      return;
    }

    // Set a timeout to show "Capture anyway" if detection takes too long
    if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    setDetectionTimedOut(false);
    detectionTimeoutRef.current = window.setTimeout(() => {
      setDetectionTimedOut(true);
    }, 5000);

    const detect = async () => {
      if (!isCameraOpen || !videoRef.current || !streamRef.current) {
        setIsFaceCentered(false);
        return;
      }

      // If the video is paused or ended, stop detecting
      if (videoRef.current.paused || videoRef.current.ended) {
        detectionIntervalRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        // Only run face detection if models are loaded
        if (modelsLoaded) {
          const detections = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
          );

          if (detections) {
            const { x, y, width, height } = detections.box;
            const video = videoRef.current;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            const faceCenterX = x + width / 2;
            const faceCenterY = y + height / 2;
            const screenCenterX = videoWidth / 2;
            const screenCenterY = videoHeight / 2;

            const distance = Math.sqrt(
              Math.pow(faceCenterX - screenCenterX, 2) +
              Math.pow(faceCenterY - screenCenterY, 2)
            );

            // Face is centered if it's within 15% of the center and takes up enough space
            const isCentered = distance < videoWidth * 0.2 && width > videoWidth * 0.2;
            setIsFaceCentered(isCentered);
          } else {
            setIsFaceCentered(false);
          }
        } else {
          // If models didn't load, allow manual capture after 3 seconds
          setIsFaceCentered(false);
        }
      } catch (e) {
        console.error('Detection error', e);
        setIsFaceCentered(false);
      }

      detectionIntervalRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const loadEvent = async () => {
    if (!accessCode) {
      setLoading(false);
      setError('Access code required');
      return;
    }

    try {
      console.log('ClientEventAccess: loading event for accessCode=', accessCode);
      const data = await api.getEventByCode(accessCode);
      console.log('ClientEventAccess: getEventByCode response=', data);
      const resolvedEvent = data.event || data;
      setEvent(resolvedEvent as any);
      const codeForPins = (resolvedEvent as any)?.accessCode || accessCode;
      setFamilyPins(generatePins(codeForPins, 1));
    } catch (err) {
      console.error('ClientEventAccess: loadEvent error=', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const generatePins = (accessCode: string, count = 1) => {
    const pins: string[] = [];
    for (let i = 0; i < count; i++) {
      let seed = 0;
      for (let j = 0; j < accessCode.length; j++) {
        seed = (seed * 31 + accessCode.charCodeAt(j) + i) & 0xffffffff;
      }
      const pin = ((Math.abs(seed) % 9000) + 1000).toString();
      pins.push(pin);
    }
    return pins;
  };

  const loadAllEventPhotos = async () => {
    if (!event) return;
    setLoadingPhotos(true);
    try {
      const eventId = (event as any).id || (event as any)._id;
      const resp = await api.getEventPhotos(eventId, 1, 1000);
      setEventPhotos(resp.photos || resp.photos || []);
      setSelectedPhotoIds([]);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load photos' });
    } finally {
      setLoadingPhotos(false);
    }
  };

  const validatePin = async () => {
    if (!clientPinInput || clientPinInput.length !== 4) {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: 'Enter a 4-digit PIN' });
      return;
    }
    const pin = clientPinInput.trim();
    if (familyPins.includes(pin)) {
      const eventId = (event as any).id || (event as any)._id;
      const storageKey = `pinUsage:${eventId}:${pin}`;
      const MAX_PIN_VIEWS = 5;
      const usedTimes = parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;

      if (usedTimes >= MAX_PIN_VIEWS) {
        toast({ variant: 'destructive', title: 'PIN Limit Reached', description: `This PIN has already been used ${MAX_PIN_VIEWS} times. Access disabled.` });
        setClientPinValidated(false);
        setClientPinInput('');
        return;
      }

      // allow access and increment counter
      const newCount = usedTimes + 1;
      try {
        const resp = await api.getEventPhotos(eventId, 1, 1000);
        const photos = resp.photos || [];
        const pinAccessId = `pin-${eventId}-${pin}`;
        const clientAccessLike = {
          _id: pinAccessId,
          eventId,
          clientName: 'Family PIN',
          matchedPhotoIds: photos.map((p: any) => p._id || p.id),
          matchedPhotoCount: photos.length,
          createdAt: new Date().toISOString(),
          eventTitle: event?.title,
        } as any;

        // persist usage count locally
        try {
          localStorage.setItem(storageKey, String(newCount));
        } catch (err) {
          // ignore localStorage failures
        }

        toast({ title: 'PIN accepted', description: `Opening photos (view ${newCount} of ${MAX_PIN_VIEWS})` });
        navigate(`/client/photos/${pinAccessId}`, { state: { clientAccess: clientAccessLike, photos } });
        setClientPinValidated(false);
        setEventPhotos([]);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load photos' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: 'The PIN entered is not valid' });
      setClientPinValidated(false);
      setClientPinInput('');
    }
  };

  const downloadAllPhotos = async () => {
    if (!eventPhotos || eventPhotos.length === 0) return;
    toast({ title: 'Starting download', description: `Downloading ${eventPhotos.length} photos` });
    for (const photo of eventPhotos) {
      try {
        const url = api.getPublicPhotoUrl(photo._id || photo.id);
        const resp = await fetch(url);
        const blob = await resp.blob();
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = photo.filename || `${photo._id}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error('Download failed for photo', photo, e);
      }
    }
    toast({ title: 'Downloads started', description: 'Your browser may prompt for multiple downloads' });
  };

  useEffect(() => {
    if (!isCameraOpen) return;
    if (!streamRef.current) return;
    if (!videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    const handleLoadedMetadata = () => {
      setIsCameraReady(true);
      video.play().catch(() => { });
      startDetection();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isCameraOpen]);

  const handleOpenCamera = async () => {
    setError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera is not supported on this device. Please upload a selfie instead.');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      setIsCameraOpen(true);
      setIsCameraReady(false);
      setSelfieFile(null);
      setSelfiePreview('');
    } catch {
      setError('Unable to access camera. Please allow camera permission or upload a selfie instead.');
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    setIsCameraOpen(false);
    setIsCameraReady(false);
    setIsFaceCentered(false);
    setDetectionTimedOut(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const size = Math.min(videoWidth, videoHeight);

    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) return;

    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;

    context.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'selfie-camera.jpg', { type: 'image/jpeg' });

      await processFile(file);
      handleCloseCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Ghibli inline state
  const [ghibliSource, setGhibliSource] = useState<string>('');
  const [ghibliConverting, setGhibliConverting] = useState(false);
  const [ghibliResult, setGhibliResult] = useState<string>('');
  const [ghibliError, setGhibliError] = useState('');
  const ghibliFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleGhibliFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setGhibliSource(String(r.result || ''));
    r.readAsDataURL(f);
  };

  const convertGhibliInline = async () => {
    setGhibliError('');
    if (!ghibliSource) { setGhibliError('Please upload a photo first.'); return; }
    setGhibliConverting(true);
    try {
      const srcBlob = await (await fetch(ghibliSource)).blob();
      const file = new File([srcBlob], 'photo.jpg', { type: srcBlob.type || 'image/jpeg' });
      const resultBlob = await api.convertToGhibli(file);
      setGhibliResult(URL.createObjectURL(resultBlob));
    } catch (err) {
      setGhibliError(err instanceof Error ? err.message : 'Conversion failed');
    } finally { setGhibliConverting(false); }
  };

  const downloadGhibli = async () => {
    if (!ghibliResult) return;
    try {
      const r = await fetch(ghibliResult);
      const b = await r.blob();
      const a = document.createElement('a');
      const u = URL.createObjectURL(b);
      a.href = u; a.download = 'ghibli-art.jpg'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
    } catch (_) { }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfiePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile || !accessCode) return;

    setUploading(true);
    setError('');

    try {
      const result = await api.recognizeFace(accessCode, {
        clientName,
        clientEmail,
        clientPhone,
        selfie: selfieFile,
      });

      navigate(`/client/photos/${result.clientAccess._id}`, {
        state: {
          matchCount: result.matchedPhotoCount,
          processingTime: result.processingTimeMs
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process selfie';

      if (errorMessage.includes('No face detected')) {
        setError('We couldn\'t detect a clear face in your photo. Please upload a well-lit selfie facing the camera.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="text-center space-y-6 relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-ping" />
            <Loader2 className="w-16 h-16 animate-spin text-purple-500 relative z-10" />
          </div>
          <p className="text-gray-400 font-medium text-lg animate-pulse">Loading Event Details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-red-500/30 bg-gray-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl text-white">Access Error</h3>
                <p className="text-gray-400">{error || 'Event not found'}</p>
              </div>
              <Button
                onClick={() => navigate('/client')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-12 text-base transition-all hover:scale-[1.02]"
                variant="outline"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Access Code Entry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse delay-1000" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">

          {/* Left Column: Event Info & Tips */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-3 md:mb-4 leading-tight">
                {event?.title}
              </h1>
              {event?.description && (
                <p className="text-gray-400 text-base md:text-lg mb-4 md:mb-6 leading-relaxed">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-500 mb-6 md:mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  {new Date(event?.eventDate || '').toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
                  <Camera className="w-4 h-4 text-blue-400" />
                  {event?.photoCount} Photos
                </div>
              </div>
            </motion.div>



            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-500 to-orange-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Selfie Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      </div>
                      <span>Use good lighting, preferably facing a window or light source.</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      </div>
                      <span>Look directly at the camera and keep your face unobstructed (remove sunglasses/masks).</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      </div>
                      <span>If multiple people are in the photo, we'll find photos for everyone detected!</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Upload Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="border-b border-gray-800 pb-6 relative z-10">
                <CardTitle className="text-2xl text-white">Find Your Photos</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload a selfie to instantly match and retrieve your photos from the event.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 md:pt-8 relative z-10">
                <div className="mb-4">
                  <div className="w-full">
                    <div className="flex flex-col gap-4 w-full">
                      <Button
                        type="button"
                        onClick={() => setMode('face')}
                        className={`w-full h-11 rounded-full px-4 font-semibold transition-all focus:outline-none active:scale-[0.99] ${mode === 'face' ? 'bg-purple-600 text-white shadow-lg ring-2 ring-black/20' : 'bg-black text-white border border-gray-700 hover:bg-purple-600 hover:text-white focus:ring-0'}`}
                      >
                        <Camera className="w-4 h-4 mr-2 inline-block" /> Face Recognition
                      </Button>

                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                          type="button"
                          onClick={() => setMode('pin')}
                          className={`min-w-0 w-full sm:flex-1 h-11 rounded-full font-semibold text-sm transition-all focus:outline-none active:scale-[0.99] ${mode === 'pin' ? 'bg-purple-600 text-white shadow-lg ring-2 ring-black/20' : 'bg-black text-white border  hover:bg-purple-600 hover:text-white focus:ring-0'}`}
                        >
                          Family PIN Access
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setMode('ghibli')}
                          className={`min-w-0 w-full sm:flex-1 h-11 rounded-full font-semibold text-sm transition-all focus:outline-none active:scale-[0.99] ${mode === 'ghibli' ? 'bg-purple-600 text-white shadow-lg ring-2 ring-black/20' : 'bg-black text-white border border-gray-700 hover:bg-purple-600 hover:text-white focus:ring-0'}`}
                        >
                          <Sparkles className="w-4 h-4 mr-2 inline-block" /> Ghibli Art Studio
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {mode === 'face' && (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Selfie Upload Area */}
                    <div className="space-y-4">
                      <Label htmlFor="selfie" className="text-white font-medium">Your Selfie</Label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-300 ${isDragging
                            ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                            : 'border-gray-700 hover:border-gray-600 bg-black/20 hover:bg-black/30'
                          }`}
                      >
                        {selfiePreview ? (
                          <div className="relative group/preview">
                            <div className="relative overflow-hidden rounded-lg max-h-48 sm:max-h-64 mx-auto w-fit shadow-2xl ring-1 ring-white/10">
                              <img
                                src={selfiePreview}
                                alt="Preview"
                                className="max-h-48 sm:max-h-64 rounded-lg"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelfieFile(null);
                                setSelfiePreview('');
                              }}
                              className="absolute -top-3 -right-3 rounded-full shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white border-0 h-8 w-8 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div className="py-4">
                            {isCameraOpen ? (
                              <div className="space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                  <div className={`relative mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 shadow-2xl bg-black transition-colors duration-300 ${isFaceCentered ? 'border-green-500 ring-4 ring-green-500/20' : 'border-purple-500/80'
                                    }`}>
                                    <video
                                      ref={videoRef}
                                      className="w-full h-full object-cover"
                                      autoPlay
                                      playsInline
                                      muted
                                    />
                                    <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />

                                    {/* Center Navigator */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className={`w-48 h-48 rounded-full border-2 border-dashed transition-all duration-300 ${isFaceCentered ? 'border-green-400/50 scale-110' : 'border-white/20'
                                        }`} />
                                      <Target className={`absolute w-8 h-8 transition-all duration-300 ${isFaceCentered ? 'text-green-500 scale-125 opacity-100' : 'text-white/20 opacity-40'
                                        }`} />
                                    </div>
                                  </div>
                                  <p className={`text-xs font-medium transition-colors duration-300 ${isFaceCentered ? 'text-green-400' : 'text-gray-400'
                                    }`}>
                                    {isFaceCentered
                                      ? 'Perfect! Hold still and capture.'
                                      : detectionTimedOut
                                        ? 'Still having trouble? Try capturing anyway.'
                                        : 'Align your face inside the circle.'}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                  <div className="flex justify-center gap-3">
                                    <Button
                                      type="button"
                                      disabled={!isFaceCentered && !detectionTimedOut}
                                      className={`h-10 sm:h-11 px-5 sm:px-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${(isFaceCentered || detectionTimedOut)
                                          ? 'bg-green-600 hover:bg-green-500 shadow-green-900/40'
                                          : 'bg-gray-700 cursor-not-allowed opacity-50'
                                        }`}
                                      onClick={handleCapturePhoto}
                                    >
                                      <Camera className="w-5 h-5 mr-2" />
                                      Capture
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-10 sm:h-11 px-5 sm:px-6 rounded-full border-gray-700 text-gray-200 flex items-center justify-center"
                                      onClick={handleCloseCamera}
                                    >
                                      Cancel
                                    </Button>
                                  </div>

                                  {detectionTimedOut && !isFaceCentered && (
                                    <Button
                                      type="button"
                                      variant="link"
                                      onClick={handleCapturePhoto}
                                      className="text-gray-500 hover:text-gray-400 text-xs"
                                    >
                                      Face not detected? Capture anyway
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-20 h-20 rounded-full bg-gray-800/80 flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10 shadow-xl">
                                  <Scan className="w-10 h-10 text-purple-400" />
                                </div>
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-400">
                                    Choose how you want to add your selfie.
                                  </p>
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="rounded-full px-6"
                                      onClick={() => fileInputRef.current?.click()}
                                    >
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload from device
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="rounded-full border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
                                      onClick={handleOpenCamera}
                                    >
                                      <Camera className="w-4 h-4 mr-2" />
                                      Use camera
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                            <Input
                              id="selfie"
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handleSelfieSelect}
                              className="hidden"
                              required
                              ref={fileInputRef}
                            />
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* If client PIN validated show all photos overlay controls */}
                    {clientPinValidated && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                          <div className="text-sm text-gray-300">Viewing all photos for family member</div>
                          <div className="flex gap-2 items-center w-full sm:w-auto">
                            {!isSelectionMode ? (
                              <Button onClick={toggleSelectionMode} disabled={loadingPhotos || eventPhotos.length === 0} className="w-full sm:w-auto">
                                Select Photos
                              </Button>
                            ) : (
                              <>
                                <Button onClick={toggleSelectAll} disabled={eventPhotos.length === 0} className="w-full sm:w-auto">
                                  Select All{selectedPhotoIds.length === eventPhotos.length && eventPhotos.length > 0 ? ' ✓' : ''}
                                </Button>
                                <Button onClick={downloadSelectedPhotos} disabled={selectedPhotoIds.length === 0} className="w-full sm:w-auto">
                                  Download
                                </Button>
                                <Button variant="outline" onClick={toggleSelectionMode} className="w-full sm:w-auto">
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {loadingPhotos ? (
                          <div className="text-sm text-gray-400">Loading photos...</div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {eventPhotos.slice(0, 24).map((p, idx) => {
                              const pid = p._id || p.id;
                              const selected = selectedPhotoIds.includes(pid);
                              return (
                                <div key={pid} className="relative">
                                  <img
                                    src={api.getPublicThumbnailUrl(pid)}
                                    className="w-full aspect-square object-cover rounded cursor-pointer"
                                    alt={p.filename || ''}
                                    onClick={() => openGalleryAt(idx)}
                                  />
                                  <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-2 right-2 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleSelectPhoto(pid)}
                                      className="sr-only"
                                    />
                                    <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${selected ? 'bg-green-500 text-white' : 'bg-black/60 text-white/90'}`}>
                                      {selected ? (
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
                                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      ) : (
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 opacity-60">
                                          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Client Info Fields */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white font-medium">Your Name <span className="text-purple-500">*</span></Label>
                        <Input
                          id="name"
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Alex Smith"
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white font-medium">Email <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span></Label>
                          <Input
                            id="email"
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="alex@example.com"
                            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white font-medium">Phone <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span></Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20 h-12 md:h-14 text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-[1.01] hover:shadow-purple-900/40 rounded-xl"
                      disabled={uploading || !selfieFile || !clientName}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing Faces...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Find My Photos
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] md:text-xs text-gray-500 text-center px-2 md:px-4 leading-relaxed">
                      By continuing, you agree to our processing of your photo for facial recognition purposes.
                      Your selfie is not stored permanently.
                    </p>
                  </form>
                )}

                {mode === 'ghibli' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      {/* <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        Ghibli Art Studio
                      </h3>
                      <p className="text-sm text-zinc-400">Upload a single photo and convert it into a Studio Ghibli style illustration.</p>
                    </div> */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white font-medium">Your Photo</Label>
                        <div className="rounded-lg bg-black/20 border border-gray-800 p-4 mt-2 flex items-center justify-center">
                          {ghibliSource ? (
                            <img src={ghibliSource} alt="source" className="max-h-64 rounded-lg shadow-2xl" />
                          ) : (
                            <div className="text-gray-500">No photo selected</div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            onClick={() => ghibliFileInputRef.current?.click()}
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          <Input
                            ref={ghibliFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleGhibliFile}
                            className="hidden"
                          />
                        </div>
                        <div className="mt-3">
                          <Button
                            onClick={convertGhibliInline}
                            disabled={ghibliConverting || !ghibliSource}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-0"
                          >
                            {ghibliConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {ghibliConverting ? 'Converting...' : 'Convert to Ghibli Art'}
                          </Button>
                        </div>
                        {ghibliError && (
                          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200 mt-3">
                            <AlertDescription>{ghibliError}</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div>
                        <Label className="text-white font-medium">Ghibli Result</Label>
                        <div className="rounded-lg bg-black/20 border border-gray-800 p-4 mt-2 flex items-center justify-center">
                          {ghibliResult ? (
                            <img src={ghibliResult} alt="result" className="max-h-64 rounded-lg shadow-2xl" />
                          ) : (
                            <div className="text-gray-500">Converted image will appear here</div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={downloadGhibli}
                            disabled={!ghibliResult}
                            className="border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10"
                            variant="outline"
                          >
                            Download Artwork
                          </Button>
                          <Button variant="outline" onClick={() => { setGhibliResult(''); setGhibliSource(''); }}>Reset</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'pin' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-300">Enter the 4-digit PIN provided by your photographer.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <input
                        value={clientPinInput}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setClientPinInput(v);
                        }}
                        placeholder="Enter 4-digit PIN"
                        inputMode="numeric"
                        maxLength={4}
                        className="border rounded px-3 py-2 w-full sm:w-40 bg-black/20"
                      />
                      <Button onClick={validatePin} disabled={!clientPinInput} className="w-full sm:w-auto">Unlock</Button>
                      <Button variant="outline" onClick={() => { setClientPinInput(''); setClientPinValidated(false); setEventPhotos([]); }} className="w-full sm:w-auto">Reset</Button>
                    </div>

                    {clientPinValidated ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-300">Viewing all photos for family member</div>
                          <div className="flex gap-2 items-center">
                            {!isSelectionMode ? (
                              <Button onClick={toggleSelectionMode} disabled={loadingPhotos || eventPhotos.length === 0}>
                                Select Photos
                              </Button>
                            ) : (
                              <>
                                <Button onClick={toggleSelectAll} disabled={eventPhotos.length === 0}>
                                  Select All{selectedPhotoIds.length === eventPhotos.length && eventPhotos.length > 0 ? ' ✓' : ''}
                                </Button>
                                <Button onClick={downloadSelectedPhotos} disabled={selectedPhotoIds.length === 0}>
                                  Download
                                </Button>
                                <Button variant="outline" onClick={toggleSelectionMode}>
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {loadingPhotos ? (
                          <div className="text-sm text-gray-400">Loading photos...</div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {eventPhotos.slice(0, 24).map((p, idx) => {
                              const pid = p._id || p.id;
                              const selected = selectedPhotoIds.includes(pid);
                              return (
                                <div key={pid} className="relative">
                                  <img
                                    src={api.getPublicThumbnailUrl(pid)}
                                    className="w-full aspect-square object-cover rounded cursor-pointer"
                                    alt={p.filename || ''}
                                    onClick={() => openGalleryAt(idx)}
                                  />
                                  <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-1 right-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleSelectPhoto(pid)}
                                      className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selected ? 'bg-blue-500 ring-2 ring-blue-400' : 'bg-white/10'}`}>
                                      {selected && (
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white">
                                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Photos are hidden until a valid PIN is entered.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {galleryOpen && eventPhotos[galleryIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-6"
          onClick={closeGallery}
        >
          <button className="absolute top-4 right-4 text-white p-3 rounded-full bg-white/5" onClick={closeGallery} aria-label="Close">
            <X className="w-6 h-6" />
          </button>

          <button className="absolute left-2 sm:left-6 text-white p-3 rounded-full bg-white/5" onClick={(e) => { e.stopPropagation(); prevPhoto(); }} aria-label="Previous">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="max-h-[70vh] sm:max-h-[90vh] max-w-[95vw] sm:max-w-[90vw]">
            <img
              src={api.getPublicPhotoUrl(eventPhotos[galleryIndex]._id || eventPhotos[galleryIndex].id)}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] sm:max-h-[90vh] max-w-[95vw] sm:max-w-[90vw] object-contain"
              alt={eventPhotos[galleryIndex].filename || ''}
            />
            <div className="text-white/80 text-sm text-center mt-4">{galleryIndex + 1} / {eventPhotos.length}</div>
          </div>

          <button className="absolute right-2 sm:right-6 text-white p-3 rounded-full bg-white/5" onClick={(e) => { e.stopPropagation(); nextPhoto(); }} aria-label="Next">
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
}




// import { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Camera, Upload, Calendar, MapPin, Loader2, Sparkles, Scan, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, X, Target } from 'lucide-react';
// import { api } from '@/lib/api';
// import { useToast } from '@/hooks/use-toast';
// import * as faceapi from 'face-api.js';

// interface Event {
//   id: string;
//   title: string;
//   description?: string;
//   eventDate: string;
//   accessCode?: string;
//   photoCount: number;
//   clientAccessCount?: number;
// }

// export default function ClientEventAccess() {
//   const { accessCode } = useParams<{ accessCode: string }>();
//   const navigate = useNavigate();
//   const [event, setEvent] = useState<Event | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState('');
//   const { toast } = useToast();
//   const [selfieFile, setSelfieFile] = useState<File | null>(null);
//   const [selfiePreview, setSelfiePreview] = useState<string>('');
//   const [clientName, setClientName] = useState('');
//   const [clientEmail, setClientEmail] = useState('');
//   const [clientPhone, setClientPhone] = useState('');
//   const [isDragging, setIsDragging] = useState(false);
//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const [isFaceCentered, setIsFaceCentered] = useState(false);
//   const [detectionTimedOut, setDetectionTimedOut] = useState(false);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const detectionTimeoutRef = useRef<number | null>(null);
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const detectionIntervalRef = useRef<number | null>(null);
//   const [familyPins, setFamilyPins] = useState<string[]>([]);
//   const [clientPinInput, setClientPinInput] = useState('');
//   const [clientPinValidated, setClientPinValidated] = useState(false);
//   const [eventPhotos, setEventPhotos] = useState<any[]>([]);
//   const [loadingPhotos, setLoadingPhotos] = useState(false);
//   const [mode, setMode] = useState<'face' | 'pin'>('face');
//   const [galleryOpen, setGalleryOpen] = useState(false);
//   const [galleryIndex, setGalleryIndex] = useState(0);
//   const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
//   const [isSelectionMode, setIsSelectionMode] = useState(false);

//   const toggleSelectionMode = () => {
//     setSelectedPhotoIds([]);
//     setIsSelectionMode((s) => !s);
//   };

//   const toggleSelectAll = () => {
//     if (!eventPhotos || eventPhotos.length === 0) return;
//     setSelectedPhotoIds((prev) => (prev.length === eventPhotos.length ? [] : eventPhotos.map((p) => p._id || p.id)));
//   };

//   useEffect(() => {
//     if (!galleryOpen) return;
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'ArrowLeft') prevPhoto();
//       if (e.key === 'ArrowRight') nextPhoto();
//       if (e.key === 'Escape') closeGallery();
//     };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [galleryOpen, galleryIndex, eventPhotos]);

//   const openGalleryAt = (index: number) => {
//     setGalleryIndex(index);
//     setGalleryOpen(true);
//   };

//   const closeGallery = () => setGalleryOpen(false);

//   const prevPhoto = () => setGalleryIndex((i) => (eventPhotos.length ? (i - 1 + eventPhotos.length) % eventPhotos.length : 0));
//   const nextPhoto = () => setGalleryIndex((i) => (eventPhotos.length ? (i + 1) % eventPhotos.length : 0));
//   const toggleSelectPhoto = (photoId: string) => {
//     setSelectedPhotoIds((prev) => {
//       if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
//       return [...prev, photoId];
//     });
//   };

//   const downloadSelectedPhotos = async () => {
//     if (!selectedPhotoIds || selectedPhotoIds.length === 0) return;
//     const photosToDownload = eventPhotos.filter((p) => selectedPhotoIds.includes(p._id || p.id));
//     if (photosToDownload.length === 0) return;
//     toast({ title: 'Starting download', description: `Downloading ${photosToDownload.length} photos` });
//     for (const photo of photosToDownload) {
//       try {
//         const url = api.getPublicPhotoUrl(photo._id || photo.id);
//         const resp = await fetch(url);
//         const blob = await resp.blob();
//         const a = document.createElement('a');
//         const objectUrl = URL.createObjectURL(blob);
//         a.href = objectUrl;
//         a.download = photo.filename || `${photo._id}.jpg`;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         URL.revokeObjectURL(objectUrl);
//         await new Promise((r) => setTimeout(r, 200));
//       } catch (e) {
//         console.error('Download failed for photo', photo, e);
//       }
//     }
//     toast({ title: 'Downloads started', description: 'Your browser may prompt for multiple downloads' });
//   };

//   useEffect(() => {
//     loadEvent();
//     loadModels();
//   }, [accessCode]);

//   useEffect(() => {
//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       if (detectionIntervalRef.current) {
//         cancelAnimationFrame(detectionIntervalRef.current);
//       }
//     };
//   }, []);

//   const loadModels = async () => {
//     try {
//       const MODEL_URL = '/models';
//       // Load tiny face detector for fast real-time centering check
//       await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
//       setModelsLoaded(true);
//     } catch (err) {
//       console.error('Failed to load faceapi models', err);
//     }
//   };

//   const startDetection = async () => {
//     if (!videoRef.current || !modelsLoaded) {
//       if (isCameraOpen && !modelsLoaded) {
//         setTimeout(startDetection, 500);
//       }
//       return;
//     }

//     // Set a timeout to show "Capture anyway" if detection takes too long
//     if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
//     setDetectionTimedOut(false);
//     detectionTimeoutRef.current = window.setTimeout(() => {
//       setDetectionTimedOut(true);
//     }, 5000);

//     const detect = async () => {
//       if (!isCameraOpen || !videoRef.current || !streamRef.current) {
//         setIsFaceCentered(false);
//         return;
//       }

//       // If the video is paused or ended, stop detecting
//       if (videoRef.current.paused || videoRef.current.ended) {
//         detectionIntervalRef.current = requestAnimationFrame(detect);
//         return;
//       }

//       try {
//         const detections = await faceapi.detectSingleFace(
//           videoRef.current,
//           new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
//         );

//         if (detections) {
//           const { x, y, width, height } = detections.box;
//           const video = videoRef.current;
//           const videoWidth = video.videoWidth;
//           const videoHeight = video.videoHeight;

//           const faceCenterX = x + width / 2;
//           const faceCenterY = y + height / 2;
//           const screenCenterX = videoWidth / 2;
//           const screenCenterY = videoHeight / 2;

//           const distance = Math.sqrt(
//             Math.pow(faceCenterX - screenCenterX, 2) +
//             Math.pow(faceCenterY - screenCenterY, 2)
//           );

//           // Face is centered if it's within 15% of the center and takes up enough space
//           const isCentered = distance < videoWidth * 0.2 && width > videoWidth * 0.2;
//           setIsFaceCentered(isCentered);
//         } else {
//           setIsFaceCentered(false);
//         }
//       } catch (e) {
//         console.error('Detection error', e);
//       }

//       detectionIntervalRef.current = requestAnimationFrame(detect);
//     };

//     detect();
//   };

//   const loadEvent = async () => {
//     if (!accessCode) {
//       setLoading(false);
//       setError('Access code required');
//       return;
//     }

//     try {
//       const data = await api.getEventByCode(accessCode);
//       const resolvedEvent = data.event || data;
//       setEvent(resolvedEvent as any);
//       const codeForPins = (resolvedEvent as any)?.accessCode || accessCode;
//       setFamilyPins(generatePins(codeForPins, 1));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to load event');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePins = (accessCode: string, count = 1) => {
//     const pins: string[] = [];
//     for (let i = 0; i < count; i++) {
//       let seed = 0;
//       for (let j = 0; j < accessCode.length; j++) {
//         seed = (seed * 31 + accessCode.charCodeAt(j) + i) & 0xffffffff;
//       }
//       const pin = ((Math.abs(seed) % 9000) + 1000).toString();
//       pins.push(pin);
//     }
//     return pins;
//   };

//   const loadAllEventPhotos = async () => {
//     if (!event) return;
//     setLoadingPhotos(true);
//     try {
//       const eventId = (event as any).id || (event as any)._id;
//       const resp = await api.getEventPhotos(eventId, 1, 1000);
//       setEventPhotos(resp.photos || resp.photos || []);
//       setSelectedPhotoIds([]);
//     } catch (e) {
//       toast({ variant: 'destructive', title: 'Error', description: 'Failed to load photos' });
//     } finally {
//       setLoadingPhotos(false);
//     }
//   };

//   const validatePin = async () => {
//     if (!clientPinInput || clientPinInput.length !== 4) {
//       toast({ variant: 'destructive', title: 'Invalid PIN', description: 'Enter a 4-digit PIN' });
//       return;
//     }
//     const pin = clientPinInput.trim();
//     if (familyPins.includes(pin)) {
//       const eventId = (event as any).id || (event as any)._id;
//       const storageKey = `pinUsage:${eventId}:${pin}`;
//       const MAX_PIN_VIEWS = 5;
//       const usedTimes = parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;

//       if (usedTimes >= MAX_PIN_VIEWS) {
//         toast({ variant: 'destructive', title: 'PIN Limit Reached', description: `This PIN has already been used ${MAX_PIN_VIEWS} times. Access disabled.` });
//         setClientPinValidated(false);
//         setClientPinInput('');
//         return;
//       }

//       // allow access and increment counter
//       const newCount = usedTimes + 1;
//       try {
//         const resp = await api.getEventPhotos(eventId, 1, 1000);
//         const photos = resp.photos || [];
//         const pinAccessId = `pin-${eventId}-${pin}`;
//         const clientAccessLike = {
//           _id: pinAccessId,
//           eventId,
//           clientName: 'Family PIN',
//           matchedPhotoIds: photos.map((p: any) => p._id || p.id),
//           matchedPhotoCount: photos.length,
//           createdAt: new Date().toISOString(),
//           eventTitle: event?.title,
//         } as any;

//         // persist usage count locally
//         try {
//           localStorage.setItem(storageKey, String(newCount));
//         } catch (err) {
//           // ignore localStorage failures
//         }

//         toast({ title: 'PIN accepted', description: `Opening photos (view ${newCount} of ${MAX_PIN_VIEWS})` });
//         navigate(`/client/photos/${pinAccessId}`, { state: { clientAccess: clientAccessLike, photos } });
//         setClientPinValidated(false);
//         setEventPhotos([]);
//       } catch (e) {
//         toast({ variant: 'destructive', title: 'Error', description: 'Failed to load photos' });
//       }
//     } else {
//       toast({ variant: 'destructive', title: 'Invalid PIN', description: 'The PIN entered is not valid' });
//       setClientPinValidated(false);
//       setClientPinInput('');
//     }
//   };

//   const downloadAllPhotos = async () => {
//     if (!eventPhotos || eventPhotos.length === 0) return;
//     toast({ title: 'Starting download', description: `Downloading ${eventPhotos.length} photos` });
//     for (const photo of eventPhotos) {
//       try {
//         const url = api.getPublicPhotoUrl(photo._id || photo.id);
//         const resp = await fetch(url);
//         const blob = await resp.blob();
//         const a = document.createElement('a');
//         const objectUrl = URL.createObjectURL(blob);
//         a.href = objectUrl;
//         a.download = photo.filename || `${photo._id}.jpg`;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         URL.revokeObjectURL(objectUrl);
//         await new Promise((r) => setTimeout(r, 200));
//       } catch (e) {
//         console.error('Download failed for photo', photo, e);
//       }
//     }
//     toast({ title: 'Downloads started', description: 'Your browser may prompt for multiple downloads' });
//   };

//   useEffect(() => {
//     if (!isCameraOpen) return;
//     if (!streamRef.current) return;
//     if (!videoRef.current) return;

//     const video = videoRef.current;
//     video.srcObject = streamRef.current;

//     const handleLoadedMetadata = () => {
//       setIsCameraReady(true);
//       video.play().catch(() => {});
//       startDetection();
//     };

//     video.addEventListener('loadedmetadata', handleLoadedMetadata);

//     return () => {
//       video.removeEventListener('loadedmetadata', handleLoadedMetadata);
//     };
//   }, [isCameraOpen]);

//   const handleOpenCamera = async () => {
//     setError('');

//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       setError('Camera is not supported on this device. Please upload a selfie instead.');
//       return;
//     }

//     try {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//         streamRef.current = null;
//       }

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           facingMode: 'user',
//           width: { ideal: 720 },
//           height: { ideal: 720 },
//         },
//       });

//       streamRef.current = stream;

//       setIsCameraOpen(true);
//       setIsCameraReady(false);
//       setSelfieFile(null);
//       setSelfiePreview('');
//     } catch {
//       setError('Unable to access camera. Please allow camera permission or upload a selfie instead.');
//     }
//   };

//   const handleCloseCamera = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop());
//       streamRef.current = null;
//     }
//     if (detectionIntervalRef.current) {
//       cancelAnimationFrame(detectionIntervalRef.current);
//       detectionIntervalRef.current = null;
//     }
//     if (detectionTimeoutRef.current) {
//       clearTimeout(detectionTimeoutRef.current);
//       detectionTimeoutRef.current = null;
//     }
//     setIsCameraOpen(false);
//     setIsCameraReady(false);
//     setIsFaceCentered(false);
//     setDetectionTimedOut(false);
//   };

//   const handleCapturePhoto = () => {
//     if (!videoRef.current || !canvasRef.current) return;
//     if (!isCameraReady) return;

//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const videoWidth = video.videoWidth || 640;
//     const videoHeight = video.videoHeight || 480;
//     const size = Math.min(videoWidth, videoHeight);

//     canvas.width = size;
//     canvas.height = size;

//     const context = canvas.getContext('2d');
//     if (!context) return;

//     const sx = (videoWidth - size) / 2;
//     const sy = (videoHeight - size) / 2;

//     context.drawImage(video, sx, sy, size, size, 0, 0, size, size);

//     canvas.toBlob(async (blob) => {
//       if (!blob) return;

//       const file = new File([blob], 'selfie-camera.jpg', { type: 'image/jpeg' });

//       await processFile(file);
//       handleCloseCamera();
//     }, 'image/jpeg', 0.95);
//   };

//   const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       processFile(file);
//     }
//   };

//   const processFile = async (file: File) => {
//     if (!file) return;

//     if (file.size > 10 * 1024 * 1024) {
//       setError('File size must be less than 10MB');
//       return;
//     }

//     setError('');
//     setSelfieFile(file);
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setSelfiePreview(reader.result as string);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//     const file = e.dataTransfer.files?.[0];
//     if (file && file.type.startsWith('image/')) {
//       processFile(file);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selfieFile || !accessCode) return;

//     setUploading(true);
//     setError('');

//     try {
//       const result = await api.recognizeFace(accessCode, {
//         clientName,
//         clientEmail,
//         clientPhone,
//         selfie: selfieFile,
//       });

//       navigate(`/client/photos/${result.clientAccess._id}`, {
//         state: { 
//           matchCount: result.matchedPhotoCount,
//           processingTime: result.processingTimeMs
//         }
//       });
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to process selfie';

//       if (errorMessage.includes('No face detected')) {
//         setError('We couldn\'t detect a clear face in your photo. Please upload a well-lit selfie facing the camera.');
//       } else {
//         setError(errorMessage);
//       }
//     } finally {
//       setUploading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
//         </div>
        
//         <div className="text-center space-y-6 relative z-10">
//           <div className="relative inline-block">
//             <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-ping" />
//             <Loader2 className="w-16 h-16 animate-spin text-purple-500 relative z-10" />
//           </div>
//           <p className="text-gray-400 font-medium text-lg animate-pulse">Loading Event Details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !event) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
//         </div>

//         <motion.div 
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="w-full max-w-md relative z-10"
//         >
//           <Card className="border-red-500/30 bg-gray-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
//             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
//             <CardContent className="pt-8 pb-8 text-center space-y-6">
//               <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto ring-1 ring-red-500/20">
//                 <AlertCircle className="w-8 h-8 text-red-500" />
//               </div>
//               <div className="space-y-2">
//                 <h3 className="font-bold text-xl text-white">Access Error</h3>
//                 <p className="text-gray-400">{error || 'Event not found'}</p>
//               </div>
//               <Button
//                 onClick={() => navigate('/client')}
//                 className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-12 text-base transition-all hover:scale-[1.02]"
//                 variant="outline"
//               >
//                 <ArrowLeft className="w-5 h-5 mr-2" />
//                 Back to Access Code Entry
//               </Button>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
//       {/* Background Ambience */}
//       <div className="fixed inset-0 pointer-events-none z-0">
//         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse" />
//         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse delay-1000" />
//       </div>

//       <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          
//           {/* Left Column: Event Info & Tips */}
//           <div className="space-y-8">
//             <motion.div
//               initial={{ opacity: 0, x: -50 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.6, ease: "easeOut" }}
//             >
//               <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-3 md:mb-4 leading-tight">
//                 {event?.title}
//               </h1>
//               {event?.description && (
//                 <p className="text-gray-400 text-base md:text-lg mb-4 md:mb-6 leading-relaxed">
//                   {event.description}
//                 </p>
//               )}
              
//               <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-500 mb-6 md:mb-8">
//                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
//                   <Calendar className="w-4 h-4 text-purple-400" />
//                   {new Date(event?.eventDate || '').toLocaleDateString(undefined, { 
//                     weekday: 'long', 
//                     year: 'numeric', 
//                     month: 'long', 
//                     day: 'numeric' 
//                   })}
//                 </div>
//                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
//                   <Camera className="w-4 h-4 text-blue-400" />
//                   {event?.photoCount} Photos
//                 </div>
//               </div>
//             </motion.div>



//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3, duration: 0.6 }}
//             >
//               <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm overflow-hidden relative">
//                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-500 to-orange-500" />
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2 text-white">
//                     <Sparkles className="w-5 h-5 text-yellow-500" />
//                     Selfie Tips
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-4">
//                     <li className="flex items-start gap-3 text-gray-400">
//                       <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
//                         <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
//                       </div>
//                       <span>Use good lighting, preferably facing a window or light source.</span>
//                     </li>
//                     <li className="flex items-start gap-3 text-gray-400">
//                       <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
//                         <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
//                       </div>
//                       <span>Look directly at the camera and keep your face unobstructed (remove sunglasses/masks).</span>
//                     </li>
//                     <li className="flex items-start gap-3 text-gray-400">
//                       <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
//                         <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
//                       </div>
//                       <span>If multiple people are in the photo, we'll find photos for everyone detected!</span>
//                     </li>
//                   </ul>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           </div>

//           {/* Right Column: Upload Form */}
//           <motion.div
//             initial={{ opacity: 0, x: 50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
//           >
//             <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
//               <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//               <CardHeader className="border-b border-gray-800 pb-6 relative z-10">
//                 <CardTitle className="text-2xl text-white">Find Your Photos</CardTitle>
//                 <CardDescription className="text-gray-400">
//                 Upload a selfie to instantly match and retrieve your photos from the event.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="pt-6 md:pt-8 relative z-10">
//               <div className="flex gap-2 mb-4">
//                 <Button variant={mode === 'face' ? undefined : 'outline'} onClick={() => setMode('face')}>Face Recognition</Button>
//                 <Button variant={mode === 'pin' ? undefined : 'outline'} onClick={() => setMode('pin')}>Family PIN Access</Button>
//               </div>

//               {mode === 'face' && (
//                 <form onSubmit={handleSubmit} className="space-y-8">
//                   {/* Selfie Upload Area */}
//                   <div className="space-y-4">
//                     <Label htmlFor="selfie" className="text-white font-medium">Your Selfie</Label>
//                     <div
//                       onDragOver={handleDragOver}
//                       onDragLeave={handleDragLeave}
//                       onDrop={handleDrop}
//                       className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-300 ${
//                         isDragging
//                           ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
//                           : 'border-gray-700 hover:border-gray-600 bg-black/20 hover:bg-black/30'
//                       }`}
//                     >
//                       {selfiePreview ? (
//                         <div className="relative group/preview">
//                           <div className="relative overflow-hidden rounded-lg max-h-48 sm:max-h-64 mx-auto w-fit shadow-2xl ring-1 ring-white/10">
//                             <img
//                               src={selfiePreview}
//                               alt="Preview"
//                               className="max-h-48 sm:max-h-64 rounded-lg"
//                             />
//                           </div>
//                           <Button
//                             type="button"
//                             variant="secondary"
//                             size="sm"
//                             onClick={() => {
//                               setSelfieFile(null);
//                               setSelfiePreview('');
//                             }}
//                             className="absolute -top-3 -right-3 rounded-full shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white border-0 h-8 w-8 p-0"
//                           >
//                             ×
//                           </Button>
//                         </div>
//                       ) : (
//                         <div className="py-4">
//                           {isCameraOpen ? (
//                             <div className="space-y-6">
//                               <div className="flex flex-col items-center gap-4">
//                                 <div className={`relative mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 shadow-2xl bg-black transition-colors duration-300 ${
//                                   isFaceCentered ? 'border-green-500 ring-4 ring-green-500/20' : 'border-purple-500/80'
//                                 }`}>
//                                   <video
//                                     ref={videoRef}
//                                     className="w-full h-full object-cover"
//                                     autoPlay
//                                     playsInline
//                                     muted
//                                   />
//                                   <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
                                  
//                                   {/* Center Navigator */}
//                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                                     <div className={`w-48 h-48 rounded-full border-2 border-dashed transition-all duration-300 ${
//                                       isFaceCentered ? 'border-green-400/50 scale-110' : 'border-white/20'
//                                     }`} />
//                                     <Target className={`absolute w-8 h-8 transition-all duration-300 ${
//                                       isFaceCentered ? 'text-green-500 scale-125 opacity-100' : 'text-white/20 opacity-40'
//                                     }`} />
//                                   </div>
//                                 </div>
//                                 <p className={`text-xs font-medium transition-colors duration-300 ${
//                                   isFaceCentered ? 'text-green-400' : 'text-gray-400'
//                                 }`}>
//                                   {isFaceCentered 
//                                     ? 'Perfect! Hold still and capture.' 
//                                     : detectionTimedOut 
//                                       ? 'Still having trouble? Try capturing anyway.' 
//                                       : 'Align your face inside the circle.'}
//                                 </p>
//                               </div>
//                               <div className="flex flex-col gap-3">
//                                 <div className="flex justify-center gap-3">
//                                   <Button
//                                     type="button"
//                                     disabled={!isFaceCentered}
//                                     className={`h-10 sm:h-11 px-5 sm:px-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
//                                       isFaceCentered 
//                                         ? 'bg-green-600 hover:bg-green-500 shadow-green-900/40' 
//                                         : 'bg-gray-700 cursor-not-allowed opacity-50'
//                                     }`}
//                                     onClick={handleCapturePhoto}
//                                   >
//                                     <Camera className="w-5 h-5 mr-2" />
//                                     Capture
//                                   </Button>
//                                   <Button
//                                     type="button"
//                                     variant="outline"
//                                     className="h-10 sm:h-11 px-5 sm:px-6 rounded-full border-gray-700 text-gray-200 flex items-center justify-center"
//                                     onClick={handleCloseCamera}
//                                   >
//                                     Cancel
//                                   </Button>
//                                 </div>
                                
//                                 {detectionTimedOut && !isFaceCentered && (
//                                   <Button
//                                     type="button"
//                                     variant="link"
//                                     onClick={handleCapturePhoto}
//                                     className="text-gray-500 hover:text-gray-400 text-xs"
//                                   >
//                                     Face not detected? Capture anyway
//                                   </Button>
//                                 )}
//                               </div>
//                             </div>
//                           ) : (
//                             <>
//                               <div className="w-20 h-20 rounded-full bg-gray-800/80 flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10 shadow-xl">
//                                 <Scan className="w-10 h-10 text-purple-400" />
//                               </div>
//                               <div className="space-y-3">
//                                 <p className="text-sm text-gray-400">
//                                   Choose how you want to add your selfie.
//                                 </p>
//                                 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
//                                   <Button
//                                     type="button"
//                                     variant="secondary"
//                                     className="rounded-full px-6"
//                                     onClick={() => fileInputRef.current?.click()}
//                                   >
//                                     <Upload className="w-4 h-4 mr-2" />
//                                     Upload from device
//                                   </Button>
//                                   <Button
//                                     type="button"
//                                     variant="outline"
//                                     className="rounded-full border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
//                                     onClick={handleOpenCamera}
//                                   >
//                                     <Camera className="w-4 h-4 mr-2" />
//                                     Use camera
//                                   </Button>
//                                 </div>
//                               </div>
//                             </>
//                           )}
//                           <Input
//                             id="selfie"
//                             type="file"
//                             accept="image/*"
//                             capture="user"
//                             onChange={handleSelfieSelect}
//                             className="hidden"
//                             required
//                             ref={fileInputRef}
//                           />
//                           <canvas ref={canvasRef} className="hidden" />
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* If client PIN validated show all photos overlay controls */}
//                   {clientPinValidated && (
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
//                         <div className="text-sm text-gray-300">Viewing all photos for family member</div>
//                         <div className="flex gap-2 items-center w-full sm:w-auto">
//                           {!isSelectionMode ? (
//                             <Button onClick={toggleSelectionMode} disabled={loadingPhotos || eventPhotos.length===0} className="w-full sm:w-auto">
//                               Select Photos
//                             </Button>
//                           ) : (
//                             <>
//                               <Button onClick={toggleSelectAll} disabled={eventPhotos.length===0} className="w-full sm:w-auto">
//                                 Select All{selectedPhotoIds.length === eventPhotos.length && eventPhotos.length>0 ? ' ✓' : ''}
//                               </Button>
//                               <Button onClick={downloadSelectedPhotos} disabled={selectedPhotoIds.length===0} className="w-full sm:w-auto">
//                                 Download
//                               </Button>
//                               <Button variant="outline" onClick={toggleSelectionMode} className="w-full sm:w-auto">
//                                 Cancel
//                               </Button>
//                             </>
//                           )}
//                         </div>
//                       </div>

//                       {loadingPhotos ? (
//                         <div className="text-sm text-gray-400">Loading photos...</div>
//                       ) : (
//                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
//                           {eventPhotos.slice(0, 24).map((p, idx) => {
//                             const pid = p._id || p.id;
//                             const selected = selectedPhotoIds.includes(pid);
//                             return (
//                               <div key={pid} className="relative">
//                                 <img
//                                   src={api.getPublicThumbnailUrl(pid)}
//                                   className="w-full aspect-square object-cover rounded cursor-pointer"
//                                   alt={p.filename || ''}
//                                   onClick={() => openGalleryAt(idx)}
//                                 />
//                                 <label
//                                   onClick={(e) => e.stopPropagation()}
//                                   className="absolute top-2 right-2 cursor-pointer"
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     checked={selected}
//                                     onChange={() => toggleSelectPhoto(pid)}
//                                     className="sr-only"
//                                   />
//                                   <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${selected ? 'bg-green-500 text-white' : 'bg-black/60 text-white/90'}`}>
//                                     {selected ? (
//                                       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
//                                         <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                                       </svg>
//                                     ) : (
//                                       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 opacity-60">
//                                         <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
//                                       </svg>
//                                     )}
//                                   </div>
//                                 </label>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {/* Client Info Fields */}
//                   <div className="space-y-6">
//                     <div className="space-y-2">
//                       <Label htmlFor="name" className="text-white font-medium">Your Name <span className="text-purple-500">*</span></Label>
//                       <Input
//                         id="name"
//                         type="text"
//                         value={clientName}
//                         onChange={(e) => setClientName(e.target.value)}
//                         placeholder="e.g. Alex Smith"
//                         className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-11"
//                         required
//                       />
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
//                       <div className="space-y-2">
//                         <Label htmlFor="email" className="text-white font-medium">Email <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span></Label>
//                         <Input
//                           id="email"
//                           type="email"
//                           value={clientEmail}
//                           onChange={(e) => setClientEmail(e.target.value)}
//                           placeholder="alex@example.com"
//                           className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-11"
//                         />
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="phone" className="text-white font-medium">Phone <span className="text-gray-500 text-xs font-normal ml-1">(Optional)</span></Label>
//                         <Input
//                           id="phone"
//                           type="tel"
//                           value={clientPhone}
//                           onChange={(e) => setClientPhone(e.target.value)}
//                           placeholder="+1 (555) 000-0000"
//                           className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20 h-11"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {error && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: 'auto' }}
//                     >
//                       <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
//                         <AlertDescription>{error}</AlertDescription>
//                       </Alert>
//                     </motion.div>
//                   )}

//                   <Button
//                     type="submit"
//                     className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20 h-12 md:h-14 text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-[1.01] hover:shadow-purple-900/40 rounded-xl"
//                     disabled={uploading || !selfieFile || !clientName}
//                   >
//                     {uploading ? (
//                       <>
//                         <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//                         Analyzing Faces...
//                       </>
//                     ) : (
//                       <>
//                         <Upload className="w-5 h-5 mr-2" />
//                         Find My Photos
//                       </>
//                     )}
//                   </Button>

//                   <p className="text-[11px] md:text-xs text-gray-500 text-center px-2 md:px-4 leading-relaxed">
//                     By continuing, you agree to our processing of your photo for facial recognition purposes.
//                     Your selfie is not stored permanently.
//                   </p>
//                 </form>
//               )}

//               {mode === 'pin' && (
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm text-gray-300">Enter the 4-digit PIN provided by your photographer.</p>
//                   </div>

//                   <div className="flex flex-col sm:flex-row gap-2 w-full">
//                     <input
//                       value={clientPinInput}
//                       onChange={(e) => {
//                         const v = e.target.value.replace(/\D/g, '').slice(0, 4);
//                         setClientPinInput(v);
//                       }}
//                       placeholder="Enter 4-digit PIN"
//                       inputMode="numeric"
//                       maxLength={4}
//                       className="border rounded px-3 py-2 w-full sm:w-40 bg-black/20"
//                     />
//                     <Button onClick={validatePin} disabled={!clientPinInput} className="w-full sm:w-auto">Unlock</Button>
//                     <Button variant="outline" onClick={() => { setClientPinInput(''); setClientPinValidated(false); setEventPhotos([]); }} className="w-full sm:w-auto">Reset</Button>
//                   </div>

//                   {clientPinValidated ? (
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between">
//                         <div className="text-sm text-gray-300">Viewing all photos for family member</div>
//                         <div className="flex gap-2 items-center">
//                           {!isSelectionMode ? (
//                             <Button onClick={toggleSelectionMode} disabled={loadingPhotos || eventPhotos.length===0}>
//                               Select Photos
//                             </Button>
//                           ) : (
//                             <>
//                               <Button onClick={toggleSelectAll} disabled={eventPhotos.length===0}>
//                                 Select All{selectedPhotoIds.length === eventPhotos.length && eventPhotos.length>0 ? ' ✓' : ''}
//                               </Button>
//                               <Button onClick={downloadSelectedPhotos} disabled={selectedPhotoIds.length===0}>
//                                 Download
//                               </Button>
//                               <Button variant="outline" onClick={toggleSelectionMode}>
//                                 Cancel
//                               </Button>
//                             </>
//                           )}
//                         </div>
//                       </div>

//                       {loadingPhotos ? (
//                         <div className="text-sm text-gray-400">Loading photos...</div>
//                       ) : (
//                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
//                           {eventPhotos.slice(0, 24).map((p, idx) => {
//                             const pid = p._id || p.id;
//                             const selected = selectedPhotoIds.includes(pid);
//                             return (
//                               <div key={pid} className="relative">
//                                 <img
//                                   src={api.getPublicThumbnailUrl(pid)}
//                                   className="w-full aspect-square object-cover rounded cursor-pointer"
//                                   alt={p.filename || ''}
//                                   onClick={() => openGalleryAt(idx)}
//                                 />
//                                 <label
//                                   onClick={(e) => e.stopPropagation()}
//                                   className="absolute top-1 right-1 cursor-pointer"
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     checked={selected}
//                                     onChange={() => toggleSelectPhoto(pid)}
//                                     className="sr-only"
//                                   />
//                                   <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selected ? 'bg-blue-500 ring-2 ring-blue-400' : 'bg-white/10'}`}>
//                                     {selected && (
//                                       <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white">
//                                         <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                                       </svg>
//                                     )}
//                                   </div>
//                                 </label>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     <p className="text-sm text-gray-400">Photos are hidden until a valid PIN is entered.</p>
//                   )}
//                 </div>
//               )}
//               </CardContent>
//             </Card>
//           </motion.div>
//         </div>
//       </div>

//       {galleryOpen && eventPhotos[galleryIndex] && (
//         <div
//           className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-6"
//           onClick={closeGallery}
//         >
//           <button className="absolute top-4 right-4 text-white p-3 rounded-full bg-white/5" onClick={closeGallery} aria-label="Close">
//             <X className="w-6 h-6" />
//           </button>

//           <button className="absolute left-2 sm:left-6 text-white p-3 rounded-full bg-white/5" onClick={(e) => { e.stopPropagation(); prevPhoto(); }} aria-label="Previous">
//             <ArrowLeft className="w-6 h-6" />
//           </button>

//           <div className="max-h-[70vh] sm:max-h-[90vh] max-w-[95vw] sm:max-w-[90vw]">
//             <img
//               src={api.getPublicPhotoUrl(eventPhotos[galleryIndex]._id || eventPhotos[galleryIndex].id)}
//               onClick={(e) => e.stopPropagation()}
//               className="max-h-[70vh] sm:max-h-[90vh] max-w-[95vw] sm:max-w-[90vw] object-contain"
//               alt={eventPhotos[galleryIndex].filename || ''}
//             />
//             <div className="text-white/80 text-sm text-center mt-4">{galleryIndex + 1} / {eventPhotos.length}</div>
//           </div>

//           <button className="absolute right-2 sm:right-6 text-white p-3 rounded-full bg-white/5" onClick={(e) => { e.stopPropagation(); nextPhoto(); }} aria-label="Next">
//             <ArrowRight className="w-6 h-6" />
//           </button>
//         </div>
//       )}

//     </div>
//   );
// }
