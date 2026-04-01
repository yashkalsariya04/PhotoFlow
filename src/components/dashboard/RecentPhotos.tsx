import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { samplePhotos as mockPhotos } from '@/data/mockData';
import { api } from '@/lib/api';

import { useNavigate } from 'react-router-dom';

const RecentPhotos = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchRecentPhotos = async (limit = 8) => {
      try {
        // Use a large limit when requesting all photos
        const reqParams: any = {};
        if (limit) reqParams.limit = limit;
        const res = await api.getPhotos(Object.keys(reqParams).length ? reqParams : undefined);

        const fetched = res && (res.photos || res.data || res) ? (res.photos || res.data || res) : [];
        if (Array.isArray(fetched) && fetched.length > 0) {
          setPhotos(fetched);
        } else {
          setPhotos(mockPhotos.slice(0, limit || 8));
        }
      } catch (error) {
        console.error('Failed to fetch recent photos:', error);
        setPhotos(mockPhotos.slice(0, limit || 8));
      } finally {
        setLoading(false);
      }
    };

    // initial load: limit to 8 unless showAll is true
    fetchRecentPhotos(showAll ? 10000 : 8);
  }, [showAll]);

  if (loading) {
    return (
      <div className="rounded-2xl glass p-6 h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Uploads</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary transition-colors"
          onClick={() => navigate('/gallery')}
        >
          View all
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo._id || photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
          >
            <img
              src={photo._id ? api.getPublicThumbnailUrl(photo._id) : (photo.thumbnailUrl || photo.thumbnail)}
              alt={photo.title || photo.filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8 bg-background/20 hover:bg-background/40">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 bg-background/20 hover:bg-background/40">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 bg-background/20 hover:bg-background/40">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 bg-background/20 hover:bg-background/40">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* AI Tags */}
            {(photo.aiTags || photo.tags) && (photo.aiTags?.length > 0 || photo.tags?.length > 0) && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/80 text-primary-foreground">
                  AI
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentPhotos;
