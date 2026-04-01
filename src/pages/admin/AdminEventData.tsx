import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Camera, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  RefreshCw, 
  Trash2,
  Search,
  LayoutGrid,
  Grid3x3,
  List,
  Upload,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Event {
  _id: string;
  title: string;
  description?: string;
  eventDate: string;
  accessCode: string;
  photoCount: number;
  clientAccessCount: number;
  isActive: boolean;
  photographerId: string | null;
}

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
}

interface Photo {
  _id: string;
  filename: string;
  faceCount: number;
}

export default function AdminEventData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [photosMap, setPhotosMap] = useState<Record<string, Photo[]>>({});
  const [thumbsMap, setThumbsMap] = useState<Record<string, Record<string, string>>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState("list");

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, usersRes] = await Promise.all([
        api.getAllEvents(),
        api.getAllUsers()
      ]);
      
      // Handle various response formats for events
      let eventsData: Event[] = [];
      if (Array.isArray(eventsRes)) {
        eventsData = eventsRes;
      } else if (eventsRes && Array.isArray(eventsRes.events)) {
        eventsData = eventsRes.events;
      }
      setEvents(eventsData);
      
      // Handle various response formats for users
      let usersData: User[] = [];
      if (Array.isArray(usersRes)) {
        usersData = usersRes;
      } else if (usersRes && Array.isArray(usersRes.users)) {
        usersData = usersRes.users;
      }
      setUsers(usersData);
      
    } catch (err) {
      console.error("Failed to load data:", err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        await loadData();
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitial();
  }, [loadData]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      // Exclusive expansion: if clicking same user, collapse it. If clicking different, expand it and collapse others.
      const isExpanded = !!prev[userId];
      return isExpanded ? {} : { [userId]: true };
    });
  };

  const toggleExpand = async (eventId: string) => {
    const currentlyExpanded = !!expanded[eventId];
    setExpanded(prev => ({ ...prev, [eventId]: !currentlyExpanded }));

    if (currentlyExpanded) return;

    if (!photosMap[eventId]) {
      setLoadingPhotos(prev => ({ ...prev, [eventId]: true }));
      try {
        const resp = await api.getEventPhotos(eventId);
        const photos: Photo[] = resp.photos || [];
        setPhotosMap(prev => ({ ...prev, [eventId]: photos }));

        if (photos.length) {
          const thumbMap: Record<string, string> = {};
          await Promise.all(
            photos.map(async (p) => {
              try {
                const blob = await api.getThumbnailBlob(p._id);
                thumbMap[p._id] = URL.createObjectURL(blob);
              } catch {
                // Ignore errors
              }
            })
          );
          setThumbsMap(prev => ({ ...prev, [eventId]: thumbMap }));
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load event photos',
        });
      } finally {
        setLoadingPhotos(prev => ({ ...prev, [eventId]: false }));
      }
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e._id !== eventId));
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete event',
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertDescription>Only admins can view event data</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  // Filter users
  const filteredUsers = users
    .filter(u => {
      const searchLower = userSearchQuery.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
      );
    })
    .filter(u => {
      // If a user is expanded, only show that user
      const expandedId = Object.keys(expandedUsers).find(id => expandedUsers[id]);
      return expandedId ? u.id === expandedId : true;
    });

  return (
    <AdminLayout>
      <div className="space-y-6 p-1">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Event Data</h1>
            <p className="text-slate-400 mt-1">View all events grouped by photographer</p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading} className="border-slate-700 text-slate-200 hover:bg-slate-800">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* User Search Bar and View Toggles */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users by name or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
          
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-slate-950/80 border border-slate-800/80 rounded-xl">
              <TabsTrigger value="list" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200">
                <List className="w-4 h-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="grid" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="tiles" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200">
                <Grid3x3 className="w-4 h-4 mr-2" />
                Tiles
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {initialLoading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 border-dashed shadow-[0_22px_60px_rgba(0,0,0,0.75)]">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-medium text-slate-300">No users found</h3>
            <p className="text-slate-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : viewMode === 'tiles' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4"}>
            {filteredUsers.map(u => {
              const userId = u.id || u._id;
              if (!userId) return null;
              
              const userEvents = events.filter(e => e.photographerId === userId);
              const isUserExpanded = !!expandedUsers[userId];
              
              const filteredUserEvents = userEvents.filter(event => 
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
              );

              return (
                <Card
                  key={userId}
                  className={`overflow-hidden border-slate-800/80 bg-slate-950/80 hover:border-slate-700 transition-colors rounded-2xl shadow-[0_22px_60px_rgba(0,0,0,0.75)] ${isUserExpanded ? 'col-span-full border-indigo-500/50' : ''}`}
                >
                  <div 
                    className={`cursor-pointer ${viewMode === 'tiles' ? 'p-6 flex flex-col items-center text-center gap-3 hover:bg-slate-800/50' : 'p-5 flex items-center justify-between hover:bg-slate-800/50'}`}
                    onClick={() => toggleUserExpand(userId)}
                  >
                    {viewMode === 'tiles' ? (
                      <>
                        <Avatar className="h-20 w-20 mb-2 border-2 border-slate-700">
                          <AvatarImage src={api.getAvatarUrl(userId)} />
                          <AvatarFallback className="text-2xl bg-indigo-950 text-indigo-400">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-1">
                          <h3 className="font-bold truncate text-slate-200 text-lg">{u.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 px-3">{userEvents.length} Events</Badge>
                           {isUserExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-slate-700/80 shadow-sm">
                            <AvatarImage src={api.getAvatarUrl(userId)} />
                            <AvatarFallback className="text-sm bg-indigo-950 text-indigo-400">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold truncate text-slate-200">{u.name}</h3>
                            <p className="text-sm text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="px-3 py-1 bg-slate-800 text-slate-300 border-slate-700">{userEvents.length} Events</Badge>
                          {isUserExpanded ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                      </>
                    )}
                  </div>

                  {isUserExpanded && (
                    <CardContent className="border-t border-slate-800/70 p-6 bg-slate-950/40">
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                             <h4 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                               <Calendar className="w-5 h-5 text-indigo-400" />
                               Events by {u.name}
                             </h4>
                             <div className="relative w-full sm:w-64">
                               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                               <Input 
                                 placeholder="Filter events..." 
                                 className="pl-8 bg-slate-900 border-slate-700 h-9 text-sm"
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                               />
                             </div>
                          </div>
                          
                          <div className="grid gap-4">
                            {filteredUserEvents.map(event => (
                              <div key={event._id} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 transition-all hover:border-slate-700 shadow-[0_16px_40px_rgba(0,0,0,0.65)]">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                      <h5 className="font-medium text-slate-200 text-lg">{event.title}</h5>
                                      <Badge variant={event.isActive ? 'default' : 'secondary'} className={`text-[10px] ${event.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                        {event.isActive ? 'Active' : 'Archived'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                      <span className="mx-1">•</span>
                                      <span className="font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">{event.accessCode}</span>
                                    </p>
                                  </div>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button size="sm" variant="outline" onClick={() => toggleExpand(event._id)} className="border-slate-700 text-slate-300 flex-1 sm:flex-none">
                                      {expanded[event._id] ? (
                                        <><ImageIcon className="w-4 h-4 mr-2" /> Hide Photos</>
                                      ) : (
                                        <><ImageIcon className="w-4 h-4 mr-2" /> Show Photos ({event.photoCount})</>
                                      )}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(event._id)} className="bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {expanded[event._id] && (
                                  <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 rounded-b-xl -mx-5 -mb-5 p-5">
                                     {/* Photo Grid */}
                                     {loadingPhotos[event._id] ? (
                                       <div className="flex justify-center py-8">
                                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                       </div>
                                     ) : (photosMap[event._id] || []).length > 0 ? (
                                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                         {(photosMap[event._id] || []).map(photo => (
                                           <div key={photo._id} className="aspect-square relative rounded-md overflow-hidden bg-slate-800 group border border-slate-800 hover:border-indigo-500/50 transition-colors">
                                              <img 
                                                src={thumbsMap[event._id]?.[photo._id] || api.getPublicThumbnailUrl(photo._id)} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                alt="Event photo"
                                                loading="lazy"
                                              />
                                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-[10px] text-white truncate font-mono">
                                                  {photo.filename}
                                                </p>
                                              </div>
                                           </div>
                                         ))}
                                       </div>
                                     ) : (
                                       <div className="text-center py-8">
                                         <ImageIcon className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                                         <p className="text-slate-500 text-sm">No photos uploaded for this event</p>
                                       </div>
                                     )}
                                  </div>
                                )}
                              </div>
                            ))}
                            {filteredUserEvents.length === 0 && (
                              <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
                                <Calendar className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                                <p className="text-slate-500">No events found for this user.</p>
                              </div>
                            )}
                          </div>
                        </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
