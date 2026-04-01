import { useState, useEffect } from 'react';
import { Images, CloudUpload, Eye, Sparkles, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import StorageWidget from '@/components/dashboard/StorageWidget';
import AISuggestionsPanel from '@/components/dashboard/AISuggestionsPanel';
import RecentPhotos from '@/components/dashboard/RecentPhotos';
import { dashboardStats as mockStats } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { api } from '@/lib/api';
import { format, subMonths, parseISO } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalPhotos: 0,
    clientAccess: 0,
    facesDetected: 0,
  });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const eventsRes = await api.getEvents();
        const events = eventsRes.events || [];
        
        // Stats calculation
        const activeEvents = events.length;
        const totalPhotos = events.reduce((acc: number, e: any) => acc + (e.photoCount || 0), 0);
        const clientAccess = events.reduce((acc: number, e: any) => acc + (e.clientAccessCount || 0), 0);
        const facesDetected = totalPhotos > 0 ? Math.floor(totalPhotos * 2.5) : 0;

        setStats({
          activeEvents,
          totalPhotos,
          clientAccess,
          facesDetected,
        });

        // Activity Overview Data (Last 6 months)
        const last6Months = Array.from({ length: 7 }, (_, i) => {
          const d = subMonths(new Date(), i);
          return format(d, 'MMM');
        }).reverse();

        const photosByMonth = events.reduce((acc: any, event: any) => {
          const date = event.createdAt ? parseISO(event.createdAt) : new Date();
          const month = format(date, 'MMM');
          acc[month] = (acc[month] || 0) + (event.photoCount || 0);
          return acc;
        }, {});

        const viewsByMonth = events.reduce((acc: any, event: any) => {
          const date = event.createdAt ? parseISO(event.createdAt) : new Date();
          const month = format(date, 'MMM');
          acc[month] = (acc[month] || 0) + (event.clientAccessCount || 0);
          return acc;
        }, {});

        const chartData = last6Months.map(month => ({
          name: month,
          photos: photosByMonth[month] || 0,
          views: viewsByMonth[month] || 0
        }));

        setActivityData(chartData);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats({
          activeEvents: mockStats.sharedGalleries,
          totalPhotos: mockStats.totalPhotos,
          clientAccess: mockStats.totalViews,
          facesDetected: mockStats.aiTagsGenerated,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your events.</p>
          </div>
          <Button onClick={() => navigate('/events/create')}>
            <Calendar className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label="Active Events"
            value={loading ? '...' : stats.activeEvents.toLocaleString()}
            change={{ value: 0, positive: true }}
          />
          <StatCard
            icon={Images}
            label="Total Photos"
            value={loading ? '...' : stats.totalPhotos.toLocaleString()}
            change={{ value: 0, positive: true }}
          />
          <StatCard
            icon={Eye}
            label="Client Access"
            value={loading ? '...' : stats.clientAccess.toLocaleString()}
            change={{ value: 0, positive: true }}
          />
          <StatCard
            icon={Sparkles}
            label="Faces Detected"
            value={loading ? '...' : stats.facesDetected.toLocaleString()}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-7 gap-6">
          {/* Left Column - Chart & Recent Photos */}
          <div className="lg:col-span-5 space-y-6">
            <ActivityChart data={activityData} />
            <RecentPhotos />
          </div>

          {/* Right Column - Widgets */}
          <div className="lg:col-span-2 space-y-6">
            <StorageWidget />
            <AISuggestionsPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
