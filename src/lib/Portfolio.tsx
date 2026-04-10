import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MapPin, Instagram, Twitter, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { samplePhotos, photographerProfile } from '@/data/mockData';
import { api } from '@/lib/api';

const Portfolio = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <div className="relative h-[50vh] overflow-hidden">
        <div className="w-full h-full object-cover bg-gradient-to-r from-primary/20 to-primary/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Profile */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <img 
            src={user?.id ? api.getAvatarUrl(user.id) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Photographer')}&background=random&size=256`} 
            alt={user?.name || 'Photographer'} 
            className="w-32 h-32 rounded-full border-4 border-background mx-auto mb-6 object-cover" 
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Photographer')}&background=random&size=256`;
            }}
          />
          <h1 className="text-4xl font-bold mb-2">{user?.name || 'Photographer'}</h1>
          <p className="text-xl text-muted-foreground mb-4">{user?.designation || 'Professional Photographer'}</p>
          {user?.location && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}
          <p className="max-w-xl mx-auto text-muted-foreground mb-8">Capturing authentic moments through the lens</p>
          <div className="flex justify-center gap-3 mb-8">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => window.open(`https://instagram.com/${user?.social?.instagram || photographerProfile.social.instagram.replace('@', '')}`, '_blank')}
            >
              <Instagram className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => window.open(`https://twitter.com/${user?.social?.twitter || photographerProfile.social.twitter.replace('@', '')}`, '_blank')}
            >
              <Twitter className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => window.open(`https://${user?.website || photographerProfile.website}`, '_blank')}
            >
              <Globe className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            className="gradient-primary rounded-full px-8"
            onClick={() => {
              const email = user?.email || '';
              if (email) {
                window.location.href = `mailto:${email}`;
              }
            }}
          >
            <Mail className="w-4 h-4 mr-2" />Contact Me
          </Button>
        </motion.div>

        {/* Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-16">
          {samplePhotos.map((photo, index) => (
            <motion.div key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.1 }} className="aspect-square rounded-xl overflow-hidden group cursor-pointer">
              <img src={photo.url} alt={photo.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
