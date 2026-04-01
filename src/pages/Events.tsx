
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  Camera, 
  Users, 
  Plus, 
  Copy, 
  ExternalLink, 
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Trash2
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
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const user = await api.getCurrentUser();
      const data = user.role === 'admin' ? await api.getAllEvents() : await api.getEvents();
      setEvents(data.events || []);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load events',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.accessCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground mt-2">
              Manage your photography events and share photos with clients
            </p>
          </div>
          <Button onClick={() => navigate('/events/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to start sharing photos with clients
              </p>
              <Button onClick={() => navigate('/events/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="grid" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
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
            </div>

            <TabsContent value="grid" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <Card key={event._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="line-clamp-1" title={event.title}>
                            {event.title}
                          </CardTitle>
                          <CardDescription>
                            {new Date(event.eventDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.isActive ? 'default' : 'secondary'}>
                            {event.isActive ? 'Active' : 'Archived'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDelete(event._id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Camera className="w-4 h-4 mr-2" />
                          {event.photoCount} Photos
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-2" />
                          {event.clientAccessCount} Views
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="p-2 bg-secondary rounded-md flex items-center justify-between">
                          <code className="text-sm font-mono">{event.accessCode}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => copyAccessCode(event.accessCode)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/events/${event._id}`)}
                          >
                            Manage
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyClientLink(event.accessCode)}
                            title="Copy Client Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Access Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Photos</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{event.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{event.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(event.eventDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-1 py-0.5 rounded font-mono text-sm">{event.accessCode}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyAccessCode(event.accessCode)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.isActive ? 'default' : 'secondary'}>
                            {event.isActive ? 'Active' : 'Archived'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{event.photoCount}</TableCell>
                        <TableCell className="text-right">{event.clientAccessCount}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigate(`/events/${event._id}`)}>
                                Manage Event
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyClientLink(event.accessCode)}>
                                Copy Client Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/events/${event._id}/edit`)}>
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={(e) => handleDelete(event._id, e)}
                              >
                                Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <div className="grid md:grid-cols-[300px_1fr] gap-6">
                <Card>
                  <CardContent className="p-4">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Events for {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {date && getEventsForDate(date).length > 0 ? (
                      <div className="space-y-4">
                        {getEventsForDate(date).map(event => (
                          <div key={event._id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{event.accessCode}</Badge>
                                <span className="text-sm text-muted-foreground">{event.photoCount} photos</span>
                              </div>
                            </div>
                            <Button onClick={() => navigate(`/events/${event._id}`)}>
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No events scheduled for this day
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
