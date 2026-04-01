import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  Calendar as CalendarIcon,
  Upload
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

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
  name: string;
  email: string;
  role: string;
}

interface Photo {
  _id: string;
  filename: string;
  faceCount: number;
}

export default function EventData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [photosMap, setPhotosMap] = useState<Record<string, Photo[]>>({});
  const [thumbsMap, setThumbsMap] = useState<Record<string, Record<string, string>>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState("list");
  const [innerViewMode, setInnerViewMode] = useState("list");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, usersRes] = await Promise.all([
        api.getAllEvents(),
        api.getAllUsers()
      ]);
      console.log('API Response - Events:', eventsRes.events);
      console.log('API Response - Users:', usersRes);
      
      setEvents(eventsRes.events || []);
      setUsers(usersRes || []);
    } catch (err) {
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
    loadData();
  }, [loadData]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const isExpanded = !!prev[userId];
      return isExpanded ? {} : { [userId]: true };
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Remove unused filteredEvents at top level since we filter per user now
  // but keep date logic for general usage if needed (though now it's inside user loop)
  
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
                // Ignore errors for individual thumbnails
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

  const EventCard = ({ event, userName, userEmail }: { event: Event; userName?: string; userEmail?: string }) => {
    const isOpen = !!expanded[event._id];
    const photos = photosMap[event._id] || [];
    const thumbs = thumbsMap[event._id] || {};
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);

    const toggleSelected = (photoId: string) => {
      setSelected((prev) => ({ ...prev, [photoId]: !prev[photoId] }));
    };

    const handleUploadFiles = async (filesList: FileList | null) => {
      if (!filesList) return;
      const files = Array.from(filesList);
      for (const file of files) {
        try {
          const uploaded = await api.uploadPhoto(file, event._id) as Photo;
          
          if (uploaded.faceCount === 0) {
             toast({
              variant: 'destructive',
              title: 'No Face Detected',
              description: `Uploaded ${file.name} - but no faces were detected in this photo.`,
            });
          }

          const newId = uploaded._id;
          setPhotosMap((prev) => ({
            ...prev,
            [event._id]: [uploaded, ...(prev[event._id] || [])],
          }));
          try {
            const blob = await api.getThumbnailBlob(newId);
            setThumbsMap((prev) => ({
              ...prev,
              [event._id]: { ...(prev[event._id] || {}), [newId]: URL.createObjectURL(blob) },
            }));
          } catch {}
        } catch (err) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: err instanceof Error ? err.message : 'Failed to upload photo',
          });
        }
      }
    };

    const handleDeleteSelected = async () => {
      if (selectedIds.length === 0) return;
      if (!confirm('Are you sure you want to delete the selected photos?')) return;
      try {
        await api.deletePhotos(selectedIds);
        setPhotosMap((prev) => ({
          ...prev,
          [event._id]: (prev[event._id] || []).filter((p) => !selectedIds.includes(p._id)),
        }));
        setThumbsMap((prev) => {
          const map = { ...(prev[event._id] || {}) };
          selectedIds.forEach((id) => {
            delete map[id];
          });
          return { ...prev, [event._id]: map };
        });
        setSelected({});
        setSelectMode(false);
        toast({
          title: 'Deleted',
          description: `Removed ${selectedIds.length} photos`,
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to delete photos',
        });
      }
    };

    return (
      <Card key={event._id} className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              {event.isActive ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            {userName && userEmail && (
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{userName} ({userEmail})</span>
              </div>
            )}
            {event.description && (
              <CardDescription>{event.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toggleExpand(event._id)}>
              {isOpen ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
              {isOpen ? 'Hide Photos' : 'Show Photos'}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(event._id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Photos</span>
                <Camera className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">{event.photoCount}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Client Access</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">{event.clientAccessCount}</div>
            </div>
            <div className="rounded-lg border p-4 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Event Date</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-lg font-medium">
                {new Date(event.eventDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {isOpen && (
            <>
              {loadingPhotos[event._id] ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : photos.length === 0 ? (
                <div className="py-8 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-muted-foreground">No photos for this event</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mt-4 mb-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`upload-${event._id}`}>
                        <Button variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photos
                          </span>
                        </Button>
                      </label>
                      <input
                        id={`upload-${event._id}`}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleUploadFiles(e.target.files)}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" onClick={() => setSelectMode((v) => !v)}>
                        {selectMode ? 'Cancel Select' : 'Select Photos'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedIds.length === 0}
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {photos.map((photo) => (
                    <Card key={photo._id} className="overflow-hidden">
                      <div
                        className="relative aspect-square"
                        onClick={() => {
                          if (selectMode) toggleSelected(photo._id);
                        }}
                      >
                        <img
                          src={thumbs[photo._id] || api.getPublicThumbnailUrl(photo._id)}
                          alt={photo.filename}
                          className="w-full h-full object-cover"
                        />
                        {selectMode && (
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={!!selected[photo._id]}
                              onCheckedChange={() => toggleSelected(photo._id)}
                            />
                          </div>
                        )}
                        {photo.faceCount > 0 && (
                          <Badge className="absolute top-2 right-2 bg-purple-600">
                            <Users className="w-3 h-3 mr-1" />
                            {photo.faceCount}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>Only admins can view event data</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Data</h1>
            <p className="text-muted-foreground">View all events grouped by photographer</p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* User Search Bar and View Toggles */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="grid">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="tiles">
                <Grid3x3 className="w-4 h-4 mr-2" />
                Tiles
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : viewMode === 'tiles' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4"}>
          {
            users
            .filter(u => 
              u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
              u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
            )
            .filter(u => {
              const expandedId = Object.keys(expandedUsers).find(id => expandedUsers[id]);
              return expandedId ? u.id === expandedId : true;
            })
            .map(u => {
              const userEvents = events.filter(e => e.photographerId === u.id);
              const isUserExpanded = !!expandedUsers[u.id];
              
              // Filter user events based on search
              const filteredUserEvents = userEvents.filter(event => 
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase())
              );

              // if (userEvents.length === 0) return null; // Show all users for now

              return (
                <Card key={u.id} className={`overflow-hidden border-2 ${isUserExpanded ? 'col-span-full' : ''}`}>
                  <div 
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${viewMode === 'tiles' ? 'p-4 flex flex-col items-center text-center gap-2' : 'p-5 flex items-center justify-between'}`}
                    onClick={() => toggleUserExpand(u.id)}
                  >
                    {viewMode === 'tiles' ? (
                      <>
                        <div className="bg-primary/10 p-3 rounded-full mb-1">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div className="w-full">
                          <h3 className="font-bold truncate">{u.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="secondary">{userEvents.length}</Badge>
                           {isUserExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-1.5 rounded-full">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold truncate">{u.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">{userEvents.length} Events</Badge>
                          {isUserExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </>
                    )}
                  </div>

                  {isUserExpanded && (
                    <div className="p-4 border-t bg-muted/10">
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                        <div className="relative w-full md:w-96">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-background"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <Tabs value={innerViewMode} onValueChange={setInnerViewMode} onClick={(e) => e.stopPropagation()}>
                          <TabsList className="bg-background">
                            <TabsTrigger value="grid">
                              <LayoutGrid className="w-4 h-4 mr-2" />
                              Grid
                            </TabsTrigger>
                            <TabsTrigger value="list">
                              <List className="w-4 h-4 mr-2" />
                              List
                            </TabsTrigger>
                            <TabsTrigger value="calendar">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Calendar
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="space-y-6">
                        {filteredUserEvents.length === 0 ? (
                          <Alert>
                            <AlertDescription>No events found</AlertDescription>
                          </Alert>
                        ) : (
                          innerViewMode === 'calendar' ? (
                            <div className="flex flex-col xl:flex-row gap-6">
                              <div className="w-full xl:w-auto flex justify-center bg-background rounded-md border p-4 h-fit">
                                <CalendarComponent
                                  mode="single"
                                  selected={date}
                                  onSelect={setDate}
                                  className="rounded-md"
                                  modifiers={{
                                    hasEvent: (d) => userEvents.some(e => isSameDay(new Date(e.eventDate), d))
                                  }}
                                  modifiersStyles={{
                                    hasEvent: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                                  }}
                                />
                              </div>
                              <div className="flex-1 space-y-4">
                                 <h4 className="font-semibold">Events for {date ? format(date, 'MMM d, yyyy') : 'Selected Date'}</h4>
                                 <div className="space-y-4">
                                   {filteredUserEvents
                                     .filter(e => !date || isSameDay(new Date(e.eventDate), date))
                                     .map(event => (
                                       <EventCard key={event._id} event={event} />
                                     ))}
                                   {filteredUserEvents.filter(e => !date || isSameDay(new Date(e.eventDate), date)).length === 0 && (
                                      <p className="text-muted-foreground text-sm">No events on this date.</p>
                                   )}
                                 </div>
                              </div>
                            </div>
                          ) : (
                            <div className={innerViewMode === 'grid' ? "grid grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
                              {filteredUserEvents.map((event) => (
                                <EventCard key={event._id} event={event} />
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          }

          
          {users.length === 0 && (
            <Alert>
              <AlertDescription>No users found</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
