import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { 
   Calendar as CalendarIcon, 
   Camera, 
   Users, 
   Copy, 
   ExternalLink, 
   Search,
   LayoutGrid,
   List,
   MoreHorizontal,
   Trash2,
   MoreVertical,
   Eye,
   RefreshCw
 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Event {
  _id: string;
  title: string;
  description?: string;
  eventDate: string;
  accessCode: string;
  photoCount: number;
  clientAccessCount: number;
  isActive: boolean;
  createdAt: string;
  photographerId: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState("list");
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, usersData] = await Promise.all([
        api.getAllEvents(),
        api.getAllUsers()
      ]);

      setEvents(eventsData.events || []);
      
      const usersMap: Record<string, User> = {};
      if (Array.isArray(usersData)) {
        usersData.forEach((u: any) => {
          usersMap[u.id] = u;
        });
      }
      setUsers(usersMap);

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        await loadData();
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const handleDelete = async (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteEvent(eventId);
      setEvents(events.filter(e => e._id !== eventId));
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

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Access code copied to clipboard',
    });
  };

  const copyClientLink = (code: string) => {
    const link = `${window.location.origin}/client/event/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'Client link copied to clipboard',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.accessCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 p-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Events Management</h1>
            <p className="text-slate-400 mt-1">
              Manage all photography events across the platform.
            </p>
          </div>
           <Button onClick={loadData} variant="outline" size="sm" disabled={loading} className="border-slate-700 text-slate-200 hover:bg-slate-800">
             <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search events by name or code..."
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500 placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            </TabsList>
          </Tabs>
        </div>

        {initialLoading ? (
          <div className="flex items-center justify-center h-[40vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-slate-950/80 border-slate-800/80 rounded-2xl shadow-[0_22px_60px_rgba(0,0,0,0.75)]">
            <CardContent className="py-12 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-700" />
              <h3 className="text-lg font-semibold mb-2 text-slate-200">No Events Found</h3>
              <p className="text-slate-500 mb-6">
                No events have been created yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => {
                  const photographer = event.photographerId ? users[event.photographerId] : null;
                  return (
                  <Card
                    key={event._id}
                    className="hover:shadow-[0_22px_60px_rgba(0,0,0,0.75)] transition-all duration-200 bg-slate-950/80 border-slate-800/80 hover:border-slate-700 group rounded-2xl"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-1 text-slate-200 text-lg" title={event.title}>
                            {event.title}
                          </CardTitle>
                          <div className="flex items-center text-sm text-slate-500 gap-2">
                             <CalendarIcon className="w-3.5 h-3.5" />
                             {format(new Date(event.eventDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <Badge variant={event.isActive ? 'default' : 'secondary'} className={event.isActive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}>
                          {event.isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        {photographer ? (
                          <>
                            <Avatar className="h-8 w-8 border border-slate-700">
                              <AvatarImage src={api.getAvatarUrl(photographer.id)} />
                              <AvatarFallback className="text-xs bg-indigo-950 text-indigo-400">
                                {getInitials(photographer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-300 truncate">{photographer.name}</p>
                              <p className="text-xs text-slate-500 truncate">Photographer</p>
                            </div>
                          </>
                        ) : (
                           <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                             <Users className="w-4 h-4" />
                             Unknown Photographer
                           </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 pt-2 border-t border-slate-800">
                        <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-800/30">
                          <span className="text-lg font-bold text-slate-200">{event.photoCount}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photos
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-800/30">
                          <span className="text-lg font-bold text-slate-200">{event.clientAccessCount}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Views
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-4">
                         <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-slate-950 text-indigo-400 px-2 py-1 rounded border border-slate-800">
                              {event.accessCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-500 hover:text-white"
                              onClick={() => copyAccessCode(event.accessCode)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                         </div>

                         <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                              onClick={() => navigate(`/events/${event._id}`)}
                              title="Manage Event"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                <DropdownMenuItem onClick={() => copyClientLink(event.accessCode)}>
                                  <ExternalLink className="w-4 h-4 mr-2" /> Copy Client Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem onClick={(e) => handleDelete(event._id, e)} className="text-red-400 focus:text-red-400 focus:bg-red-900/10">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                );})}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-[0_22px_60px_rgba(0,0,0,0.75)] overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-950/90">
                    <TableRow className="border-slate-800/60 hover:bg-slate-900/70">
                      <TableHead className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Event Name</TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Photographer</TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Date</TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Code</TableHead>
                      <TableHead className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Status</TableHead>
                      <TableHead className="text-right text-slate-400 text-xs font-semibold tracking-wide uppercase">Stats</TableHead>
                      <TableHead className="text-right text-slate-400 text-xs font-semibold tracking-wide uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/40">
                    {filteredEvents.map((event) => {
                      const photographer = event.photographerId ? users[event.photographerId] : null;
                      return (
                      <TableRow key={event._id} className="border-slate-800/40 hover:bg-slate-900/70 transition-colors">
                        <TableCell className="font-medium align-middle">
                          <div className="flex flex-col">
                            <span className="text-slate-200 font-semibold">{event.title}</span>
                            <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{event.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          {photographer ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-slate-700">
                                <AvatarImage src={api.getAvatarUrl(photographer.id)} />
                                <AvatarFallback className="text-[10px] bg-indigo-950 text-indigo-400">
                                  {getInitials(photographer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-slate-300">{photographer.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500 italic">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm align-middle">
                          {format(new Date(event.eventDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-400 border border-slate-800">{event.accessCode}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-500 hover:text-white"
                              onClick={() => copyAccessCode(event.accessCode)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <Badge variant={event.isActive ? 'default' : 'secondary'} className={`text-xs ${event.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {event.isActive ? 'Active' : 'Archived'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <div className="flex flex-col items-end gap-0.5">
                             <span className="text-xs text-slate-300 flex items-center gap-1">
                               {event.photoCount} <Camera className="w-3 h-3 text-slate-500" />
                             </span>
                             <span className="text-xs text-slate-400 flex items-center gap-1">
                               {event.clientAccessCount} <Eye className="w-3 h-3 text-slate-600" />
                             </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                              <DropdownMenuItem onClick={() => navigate(`/events/${event._id}`)}>
                                Manage Event
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyClientLink(event.accessCode)}>
                                <ExternalLink className="w-4 h-4 mr-2" /> Copy Client Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-800" />
                              <DropdownMenuItem onClick={(e) => handleDelete(event._id, e)} className="text-red-400 focus:text-red-400 focus:bg-red-900/10">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
