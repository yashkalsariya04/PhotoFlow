import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Camera, AlertCircle, Loader2, Grid3x3, List, Check, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
interface Photo {
  _id: string;
  filename: string;
  metadata: {
    width: number;
    height: number;
    takenAt?: string;
  };
  aiTags: string[];
}

interface ClientAccess {
  _id: string;
  eventId: string;
  clientName: string;
  matchedPhotoIds: string[];
  matchedPhotoCount: number;
  createdAt: string;
  eventTitle?: string;
}

export default function ClientPhotos() {
  const { accessId } = useParams<{ accessId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [clientAccess, setClientAccess] = useState<ClientAccess | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerApi, setViewerApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (isViewerOpen && viewerApi) {
      viewerApi.scrollTo(activeIndex, true);
    }
  }, [isViewerOpen, viewerApi, activeIndex]);

  useEffect(() => {
    if (!viewerApi) return;
    const onSelect = () => setActiveIndex(viewerApi.selectedScrollSnap());
    viewerApi.on('select', onSelect);
    viewerApi.on('reInit', onSelect);
    return () => {
      viewerApi.off('select', onSelect);
      viewerApi.off('reInit', onSelect);
    };
  }, [viewerApi]);
  const matchCount = location.state?.matchCount;
  const processingTime = location.state?.processingTime;

  useEffect(() => {
    loadPhotos();
  }, [accessId]);

  const loadPhotos = async () => {
    // If caller provided photos/clientAccess via navigation state (e.g., PIN flow), use them
    if (location.state?.photos && location.state?.clientAccess) {
      setClientAccess(location.state.clientAccess as any);
      setPhotos(location.state.photos as Photo[]);
      setLoading(false);
      return;
    }

    if (!accessId) {
      setLoading(false);
      setError('Invalid access link');
      return;
    }

    try {
      const data = await api.getClientPhotos(accessId);
      setClientAccess(data.clientAccess);
      setPhotos(data.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p._id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const downloadPhoto = async (photoId: string, filename?: string) => {
    try {
      const response = await fetch(api.getPublicPhotoUrl(photoId));
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `photo-${photoId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download photo', err);
    }
  };

  const downloadSelected = async () => {
    const ids = Array.from(selectedPhotos);
    for (const photoId of ids) {
      const photo = photos.find(p => p._id === photoId);
      await downloadPhoto(photoId, photo?.filename);
    }
  };

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Ambient Background for Loading */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[120px] animate-pulse" />
        </div>
        
        <div className="text-center space-y-6 relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-ping" />
            <Loader2 className="w-16 h-16 animate-spin text-white relative z-10" />
          </div>
          <p className="text-zinc-400 font-medium text-lg animate-pulse">Searching for your memories...</p>
        </div>
      </div>
    );
  }

  if (error || !clientAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10 text-center space-y-8"
        >
          <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-2xl text-white">Access Error</h3>
            <p className="text-zinc-400 text-lg leading-relaxed">{error || 'Access not found'}</p>
          </div>
          <Button
            onClick={() => navigate('/client')}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white h-12 px-8 rounded-full font-medium border-0 shadow-lg shadow-indigo-500/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Client Portal
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-white/20">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/client')}
                className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                  Your Photos
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-medium shadow-sm shadow-white/5">
                    {photos.length}
                  </span>
                </h1>
                <p className="text-sm text-zinc-400">
                  Welcome, <span className="text-zinc-300 font-medium">{clientAccess.clientName}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`bg-zinc-800/50 border-white/10 ${viewMode === 'grid' ? 'bg-zinc-700/80 text-white' : 'text-zinc-300 hover:text-white hover:bg-zinc-700/80'} transition-all`}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`bg-zinc-800/50 border-white/10 ${viewMode === 'list' ? 'bg-zinc-700/80 text-white' : 'text-zinc-300 hover:text-white hover:bg-zinc-700/80'} transition-all`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats Card */}
        <AnimatePresence>
          {matchCount !== undefined && matchCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Alert className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-200 backdrop-blur-sm">
                <Camera className="h-5 w-5 text-green-400 mr-2" />
                <div className="flex flex-col gap-1">
                  <AlertDescription className="text-base">
                    Great news! We found <strong className="text-green-300">{matchCount} photos</strong> featuring you.
                  </AlertDescription>
                  {processingTime && (
                    <div className="text-xs text-green-400/70 flex gap-3 mt-1">
                      <span>Detection: {processingTime.detection}ms</span>
                      <span>Matching: {processingTime.matching}ms</span>
                      <span>Total: {processingTime.total}ms</span>
                    </div>
                  )}
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-zinc-800">
              <ImageIcon className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              No Photos Found
            </h3>
            <p className="text-zinc-400 max-w-md mx-auto text-lg leading-relaxed">
              We couldn't match any photos to your face. This might happen if the photos haven't been processed yet.
            </p>
            <Button 
              onClick={() => navigate('/client')}
              className="mt-12 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white h-12 px-10 rounded-full font-medium border-0 shadow-lg shadow-indigo-500/20"
            >
              Try Another Event
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Selection Toolbar - Floating */}
            <AnimatePresence>
              {selectedPhotos.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-auto z-50"
                >
                  <div className="bg-zinc-900/95 border border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-6 md:min-w-[400px]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-sm font-bold text-white whitespace-nowrap">
                        {selectedPhotos.size} {selectedPhotos.size === 1 ? 'photo' : 'photos'} selected
                      </span>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                        className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full flex-1 sm:flex-none h-10 px-4"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={downloadSelected}
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/25 border-0 font-bold rounded-full flex-1 sm:flex-none h-10 px-6"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-between items-center mb-6 px-1"
            >
              <p className="text-sm text-zinc-400 font-medium">
                Found {photos.length} memories
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedPhotos.size === photos.length ? deselectAll : selectAll}
                className="text-white hover:text-zinc-200 hover:bg-white/10 transition-colors"
              >
                {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
              </Button>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'
                  : 'space-y-4'
              }
            >
              <AnimatePresence mode="popLayout">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo._id}
                    variants={itemVariants}
                    layoutId={photo._id}
                    className="group relative"
                  >
                    <div
                      className={`cursor-pointer transition-all duration-300 relative overflow-hidden rounded-lg ${
                        selectedPhotos.has(photo._id)
                          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black'
                          : 'hover:opacity-90'
                      }`}
                      onClick={() => {
                        setActiveIndex(index);
                        setIsViewerOpen(true);
                      }}
                    >
                      <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                        <img
                          src={api.getPublicThumbnailUrl(photo._id)}
                          alt={photo.filename}
                          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                            selectedPhotos.has(photo._id) ? 'scale-100' : 'group-hover:scale-105'
                          }`}
                          loading="lazy"
                        />
                        <div className={`absolute inset-0 transition-all duration-300 ${
                          selectedPhotos.has(photo._id) 
                            ? 'bg-black/20 backdrop-blur-[1px]' 
                            : 'bg-transparent group-hover:bg-black/20'
                        }`}>
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadPhoto(photo._id, photo.filename);
                                  }}
                                  className="p-2 rounded-full bg-black/60 text-white/90 hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                                  aria-label="Download photo"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePhotoSelection(photo._id);
                                  }}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                                    selectedPhotos.has(photo._id)
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-black/60 text-white/90 group-hover:bg-black/80'
                                  }`}
                                  aria-label={selectedPhotos.has(photo._id) ? 'Deselect photo' : 'Select photo'}
                                >
                                  <Check className={`w-3 h-3 ${selectedPhotos.has(photo._id) ? 'scale-110' : ''}`} />
                                </button>
                            </div>
                        </div>
                      </div>
                      {viewMode === 'list' && (
                        <div className="p-4 bg-zinc-900/90 backdrop-blur border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-white truncate max-w-[200px]">{photo.filename}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {photo.metadata.width} × {photo.metadata.height}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-400 hover:text-white"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await downloadPhoto(photo._id, photo.filename);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* Bottom Actions */}
        {photos.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 sm:mt-16 flex justify-center pb-8"
          >
            <Button
              onClick={() => navigate('/client')}
              variant="outline"
              className="bg-transparent border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all px-6 sm:px-8 py-5 sm:py-6 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Search Another Event
            </Button>
          </motion.div>
        )}
      </div>
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="w-full max-w-none h-[85vh] sm:h-[90vh] bg-transparent border-0 p-0">
          <div className="w-full h-full max-w-[100vw] flex items-center justify-center relative px-2 sm:px-0 overflow-hidden" onClick={() => setIsViewerOpen(false)}>
            <Carousel className="w-full" setApi={setViewerApi}>
              <CarouselContent>
                {photos.map((photo) => (
                  <CarouselItem key={photo._id} className="flex items-center justify-center px-2">
                    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={api.getPublicPhotoUrl(photo._id)}
                        alt={photo.filename}
                        className="object-contain max-h-[45vh] sm:max-h-[80vh] max-w-[85vw] sm:max-w-none w-auto rounded-lg shadow-2xl"
                        loading="lazy"
                      />
                      <div className="absolute top-2 sm:top-3 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPhoto(photo._id, photo.filename);
                          }}
                          className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 bg-black/60 text-white/90 hover:bg-white hover:text-black transition-all"
                          aria-label="Download photo"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoSelection(photo._id);
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${
                            selectedPhotos.has(photo._id)
                              ? 'bg-indigo-500 text-white'
                              : 'bg-black/60 text-white/90'
                          }`}
                          aria-label={selectedPhotos.has(photo._id) ? 'Deselect photo' : 'Select photo'}
                        >
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">{selectedPhotos.has(photo._id) ? 'Selected' : 'Select'}</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewerApi?.scrollPrev();
                        }}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg hover:bg-black/60"
                        aria-label="Previous photo"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewerApi?.scrollNext();
                        }}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg hover:bg-black/60"
                        aria-label="Next photo"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
