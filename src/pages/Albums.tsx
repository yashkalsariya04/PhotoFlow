import { motion } from 'framer-motion';
import { Sparkles, MapPin, Users, Sun, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { smartAlbums } from '@/data/mockData';

const iconMap = {
  event: Calendar,
  theme: Sun,
  people: Users,
  location: MapPin,
  lighting: Sun,
};

const Albums = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Smart Albums</h1>
            <p className="text-muted-foreground">AI-organized collections based on your photos</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">Powered by AI</span>
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
};

export default Albums;
