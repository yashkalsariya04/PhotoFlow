import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Loader2, 
  Search, 
  Filter,
  Grid,
  LayoutGrid,
  List,
  Sparkles,
  Calendar,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Enhanced Photo Card to handle multiple view modes
const PhotoCard = ({ 
  photo, 
  onSelect, 
  onDownload, 
  index,
  viewMode
}: { 
  photo: any; 
  onSelect: (id: string) => void; 
  onDownload: (photo: any) => void;
  index: number;
  viewMode: 'grid' | 'comfort' | 'list';
}) => {
  const isList = viewMode === 'list';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden bg-zinc-900/50 border border-white/5 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all duration-500",
        isList 
          ? "flex flex-row items-center gap-6 p-3 rounded-2xl h-32 w-full" 
          : "aspect-square rounded-2xl"
      )}
      onClick={() => onSelect(photo._id || photo.id)}
    >
      {/* Image Container with fixed size rules */}
      <div className={cn(
        "relative overflow-hidden shrink-0",
        isList ? "w-28 h-28 rounded-xl" : "w-full h-full"
      )}>
        <img 
          src={api.getPublicThumbnailUrl(photo._id)} 
          alt={photo.filename} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
          loading="lazy"
        />
        
        {/* Hover Overlay - only for grid/comfort */}
        {!isList && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 backdrop-blur-[2px]">
            <div className="flex justify-between items-start">
              {photo.faceCount > 0 && (
                <Badge className="bg-indigo-500/80 hover:bg-indigo-500 backdrop-blur-md border-0 text-[10px] flex gap-1 items-center px-2 py-0.5">
                  <Sparkles className="w-3 h-3" />
                  {photo.faceCount}
                </Badge>
              )}
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-all border-0 backdrop-blur-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(photo);
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* List View Details */}
      {isList && (
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate mb-1">
                {photo.filename}
              </h4>
              <div className="flex items-center gap-3 text-zinc-500 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : 'Recent'}
                </span>
                {photo.faceCount > 0 && (
                  <span className="flex items-center gap-1 text-indigo-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {photo.faceCount} Faces Detected
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(photo);
                }}
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info Bar for grid/comfort on hover */}
      {!isList && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
          <p className="text-[10px] font-medium text-white/90 truncate">
            {photo.filename}
          </p>
        </div>
      )}
    </motion.div>
  );
};

const Gallery = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'comfort' | 'list'>('grid');
  
  const selectedIndex = photos.findIndex((p) => (p._id || p.id) === selectedPhotoId);
  const currentPhoto = photos[selectedIndex];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [photosRes, albumsRes] = await Promise.all([
          api.getPhotos({ limit: 200 }),
          api.getEvents()
        ]);
        
        if (photosRes.photos) {
          setPhotos(photosRes.photos);
        }
        if (albumsRes.events) {
          setAlbums(albumsRes.events);
        }
      } catch (error) {
        console.error('Failed to fetch gallery data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      const matchesSearch = 
        photo.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = 
        activeFilter === 'All' || 
        photo.eventId === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [photos, searchQuery, activeFilter]);

  const navigate = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex >= 0 && newIndex < filteredPhotos.length) {
      setSelectedPhotoId(filteredPhotos[newIndex]._id || filteredPhotos[newIndex].id);
    }
  };

  const handleDownload = async (photo: any) => {
    try {
      const url = api.getPublicPhotoUrl(photo._id);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = photo.filename || 'photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12 px-4">
        {/* Modern Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight">Gallery</h1>
            <p className="text-zinc-500 text-sm">Managing {filteredPhotos.length} captures</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Find a photo..." 
                className="pl-10 w-full sm:w-[280px] bg-zinc-900/50 border-white/5 h-11 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Album Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-zinc-900/50 border-white/5 h-11 px-4 rounded-xl gap-2 min-w-[140px]">
                  <Filter className="w-4 h-4" />
                  {activeFilter === 'All' ? 'All Events' : 'Filter Applied'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white w-56 p-2 rounded-xl">
                <DropdownMenuItem onClick={() => setActiveFilter('All')}>All Events</DropdownMenuItem>
                {albums.map((album) => (
                  <DropdownMenuItem key={album._id} onClick={() => setActiveFilter(album._id)}>
                    {album.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle - FIXED LAYOUT LOGIC */}
            <div className="flex items-center bg-zinc-900/80 p-1.5 rounded-xl border border-white/5 h-11">
              <Button 
                variant="ghost" 
                size="icon" 
                title="Grid View (Small)"
                className={cn("w-9 h-9 rounded-lg transition-all", viewMode === 'grid' && "bg-zinc-800 text-indigo-400")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Comfort View (Medium)"
                className={cn("w-9 h-9 rounded-lg transition-all", viewMode === 'comfort' && "bg-zinc-800 text-indigo-400")}
                onClick={() => setViewMode('comfort')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="List View"
                className={cn("w-9 h-9 rounded-lg transition-all", viewMode === 'list' && "bg-zinc-800 text-indigo-400")}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Gallery Content with Fixed Grid Rules */}
        {loading ? (
          <div className="h-[50vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/20 rounded-[2rem] border-2 border-dashed border-white/5">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
            <h3 className="text-xl font-bold text-white">No matches found</h3>
          </div>
        ) : (
          <motion.div 
            layout
            className={cn(
              "grid gap-4 sm:gap-6",
              viewMode === 'grid' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
              viewMode === 'comfort' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              viewMode === 'list' && "grid-cols-1"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo, index) => (
                <PhotoCard 
                  key={photo._id || photo.id} 
                  photo={photo} 
                  index={index}
                  viewMode={viewMode}
                  onSelect={setSelectedPhotoId}
                  onDownload={handleDownload}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Modal remains the same */}
        <AnimatePresence>
          {selectedPhotoId && currentPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
              onClick={() => setSelectedPhotoId(null)}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 z-10 text-white hover:bg-white/10 rounded-full" 
                onClick={() => setSelectedPhotoId(null)}
              >
                <X className="w-6 h-6" />
              </Button>

              <div className="relative w-full max-w-7xl h-full flex flex-col items-center justify-center gap-6">
                <img
                  src={api.getPublicPhotoUrl(currentPhoto._id)}
                  alt={currentPhoto.filename}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    className="bg-white text-black hover:bg-zinc-200 h-12 px-8 rounded-full font-bold"
                    onClick={() => handleDownload(currentPhoto)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Original
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Gallery;
