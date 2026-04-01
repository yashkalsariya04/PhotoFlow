import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
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
}

export default function EditEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    if (!eventId) return;

    try {
      const eventData = await api.getEvent(eventId);
      setEvent(eventData.event);
      setTitle(eventData.event.title);
      setDescription(eventData.event.description || '');
      setEventDate(eventData.event.eventDate.split('T')[0]); // Format date for input
      setIsActive(eventData.event.isActive);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load event',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eventId || !title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event title is required',
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title,
        description,
        eventDate: new Date(eventDate).toISOString(),
        isActive,
      };

      await api.updateEvent(eventId, updateData);
      
      toast({
        title: 'Success!',
        description: 'Event updated successfully',
      });

      navigate(`/events/${eventId}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update event',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>Event not found</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(`/events/${eventId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
            <p className="text-muted-foreground">Update event details and settings</p>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Edit the event information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary min-h-24"
                placeholder="Enter event description"
              />
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-secondary"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center gap-3">
                <select
                  id="isActive"
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="px-3 py-2 rounded-md bg-secondary border border-input text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span className="text-sm text-muted-foreground">
                  {isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            </div>

            {/* Read-only Info */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Access Code</Label>
                <code className="block text-sm font-mono bg-muted p-2 rounded">
                  {event.accessCode}
                </code>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Total Photos</Label>
                <p className="text-2xl font-bold">{event.photoCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate(`/events/${eventId}`)}>
            Cancel
          </Button>
          <Button 
            className="gradient-primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
