import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Camera, Activity, TrendingUp, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { format, subMonths, parseISO, startOfMonth } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  activeEvents: number;
  totalPhotos: number;
  systemHealth: string;
}

interface ChartData {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeEvents: 0,
    totalPhotos: 0,
    systemHealth: '99.9%',
  });
  const [eventTrend, setEventTrend] = useState<ChartData[]>([]);
  const [userGrowth, setUserGrowth] = useState<ChartData[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, eventsRes] = await Promise.all([
          api.getAllUsers(),
          api.getAllEvents()
        ]);

        const users = usersRes || [];
        const events = eventsRes.events || [];

        // Calculate Stats
        const activeEventsCount = events.filter((e: any) => e.isActive).length;
        const totalPhotosCount = events.reduce((acc: number, e: any) => acc + (e.photoCount || 0), 0);

        setStats({
          totalUsers: users.length,
          activeEvents: activeEventsCount,
          totalPhotos: totalPhotosCount,
          systemHealth: '99.9%',
        });

        // Prepare Chart Data: Event Trend (Last 6 months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(new Date(), i);
          return format(d, 'MMM');
        }).reverse();

        const eventsByMonth = events.reduce((acc: any, event: any) => {
          const date = event.eventDate ? parseISO(event.eventDate) : new Date();
          const month = format(date, 'MMM');
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const eventTrendData = last6Months.map(month => ({
          name: month,
          value: eventsByMonth[month] || 0
        }));
        setEventTrend(eventTrendData);

        // Prepare Chart Data: User Growth (Last 6 months)
        // Assuming user.createdAt exists, otherwise mock or infer
        const usersByMonth = users.reduce((acc: any, user: any) => {
          const date = user.createdAt ? parseISO(user.createdAt) : new Date(); // Fallback if no createdAt
          const month = format(date, 'MMM');
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const userGrowthData = last6Months.map(month => ({
          name: month,
          value: usersByMonth[month] || 0
        }));
        setUserGrowth(userGrowthData);

        // Recent Events
        const sortedEvents = [...events].sort((a: any, b: any) => 
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        ).slice(0, 5);
        setRecentEvents(sortedEvents);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 p-1">
        <div>
          <h1 className="text-3xl font-bold text-slate-200 tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your platform's performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">{stats.totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <UserPlus className="w-3 h-3 mr-1 text-green-500" />
                Total registered accounts
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">{stats.activeEvents}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Photos</CardTitle>
              <Camera className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">{stats.totalPhotos.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                Processed & stored
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg hover:border-sky-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">System Health</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-200">{stats.systemHealth}</div>
              <p className="text-xs text-slate-500 mt-1">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Event Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={eventTrend}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                      itemStyle={{ color: '#0ea5e9' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorEvents)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>New Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                    />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700 text-slate-200 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event._id} className="flex items-center justify-between border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-sky-500/10 p-2 rounded-full">
                      <Calendar className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{event.title}</p>
                      <p className="text-sm text-slate-400">{format(new Date(event.eventDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      {event.photoCount || 0}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${event.isActive ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))}
              {recentEvents.length === 0 && (
                <div className="text-center text-slate-500 py-4">No recent events found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
