import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Camera, Users, Copy, Upload, ExternalLink, Loader2, Grid3x3, Trash2, X, CheckSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { compressImage } from '@/lib/image-utils';
import { Switch } from '@/components/ui/switch';

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

interface Photo {
  _id: string;
  filename: string;
  metadata: {
    width: number;
    height: number;
  };
  faceCount: number;
}

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [familyPins, setFamilyPins] = useState<string[]>([]);
  const [clientPinInput, setClientPinInput] = useState('');
  const [clientPinValidated, setClientPinValidated] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    if (!eventId) return;

    try {
      const [eventData, photosData] = await Promise.all([
        api.getEvent(eventId),
        api.getEventPhotos(eventId),
      ]);
      setEvent(eventData.event);
      // generate deterministic family PIN(s) client-side from the access code
      if (eventData.event && eventData.event.accessCode) {
        setFamilyPins(generatePins(eventData.event.accessCode, 1));
      }
      setPhotos(photosData.photos || []);
      // load thumbnails for photos
      if (photosData.photos && photosData.photos.length) {
        const thumbMap: Record<string, string> = {};
        await Promise.all(
          photosData.photos.map(async (p: Photo) => {
            try {
              const blob = await api.getThumbnailBlob(p._id);
              thumbMap[p._id] = URL.createObjectURL(blob);
            } catch (e) {
              // ignore thumbnail errors
            }
          }),
        );
        setThumbnails(thumbMap);
      }
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

  const generatePins = (accessCode: string, count = 1) => {
    // Simple deterministic numeric PIN generation from accessCode
    const pins: string[] = [];
    for (let i = 0; i < count; i++) {
      let seed = 0;
      for (let j = 0; j < accessCode.length; j++) {
        seed = (seed * 31 + accessCode.charCodeAt(j) + i) & 0xffffffff;
      }
      // produce a 4-digit PIN between 1000-9999
      const pin = ((Math.abs(seed) % 9000) + 1000).toString();
      pins.push(pin);
    }
    return pins;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, shouldCompress = false) => {
    const files = e.target.files;
    if (!files || !eventId) return;

    setUploading(true);
    const totalFiles = files.length;
    let completed = 0;

    try {
      for (const file of Array.from(files)) {
        let fileToUpload = file;
        
        if (shouldCompress && file.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(file);
          } catch (err) {
            console.error('Compression failed, uploading original', err);
          }
        }

        try {
          const uploaded = await api.uploadPhoto(fileToUpload, eventId, (filePercent) => {
            // Calculate overall progress: (completed files + current file's progress) / total files
            const overallProgress = Math.round(((completed + filePercent / 100) / totalFiles) * 100);
            setUploadProgress(overallProgress);
          }) as any;
          
          if (uploaded.faceCount === 0) {
            toast({
              variant: 'destructive',
              title: 'No Face Detected',
              description: `Uploaded ${file.name} - but no faces were detected in this photo.`,
            });
          }

          setPhotos(prev => [uploaded, ...prev]);
          completed++;
          setUploadProgress(Math.round((completed / totalFiles) * 100));
        } catch (err) {
          console.error('Upload failed', err);
          toast({
            variant: 'destructive',
            title: 'Upload Error',
            description: `Failed to upload ${file.name}.`,
          });
          completed++;
          setUploadProgress(Math.round((completed / totalFiles) * 100));
        }
      }

      toast({
        title: 'Success!',
        description: `${totalFiles} photo${totalFiles > 1 ? 's' : ''} uploaded successfully ${shouldCompress ? '(compressed)' : '(original)'}`,
      });

      // Reload photos
      await loadEventData();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: err instanceof Error ? err.message : 'Failed to upload photos',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedPhotos.length} photos?`)) return;

    try {
      try {
        await api.deletePhotos(selectedPhotos);
      } catch {
        for (const id of selectedPhotos) {
          await api.deletePhoto(id);
        }
      }
      
      toast({
        title: 'Photos deleted',
        description: `Successfully deleted ${selectedPhotos.length} photos`,
      });

      setSelectedPhotos([]);
      setIsSelectionMode(false);
      await loadEventData();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete selected photos',
      });
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedPhotos([]);
  };

  const togglePhotoSelected = (photoId: string, checked?: boolean) => {
    setSelectedPhotos((prev) => {
      const isSelected = prev.includes(photoId);
      const shouldSelect = typeof checked === 'boolean' ? checked : !isSelected;
      if (shouldSelect && !isSelected) return [...prev, photoId];
      if (!shouldSelect && isSelected) return prev.filter((id) => id !== photoId);
      return prev;
    });
  };

  const toggleSelectAll = () => {
    if (photos.length === 0) return;
    setSelectedPhotos((prev) => (prev.length === photos.length ? [] : photos.map((p) => p._id)));
  };

  const copyAccessCode = () => {
    if (!event) return;
    navigator.clipboard.writeText(event.accessCode);
    toast({
      title: 'Copied!',
      description: 'Access code copied to clipboard',
    });
  };

  const copyClientLink = () => {
    if (!event) return;
    const link = `${window.location.origin}/client/event/${event.accessCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'Client link copied to clipboard',
    });
  };

  const openClientLink = () => {
    if (!event) return;
    window.open(`/client/event/${event.accessCode}`, '_blank');
  };

  const openPhoto = (photoId: string) => {
    const photoUrl = api.getPublicPhotoUrl(photoId);
    window.open(photoUrl, '_blank');
  };

  const validateClientPin = () => {
    if (!clientPinInput) return;
    if (familyPins.includes(clientPinInput.trim())) {
      setClientPinValidated(true);
      toast({ title: 'PIN accepted', description: 'Client access granted' });
    } else {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: 'The PIN entered is not valid' });
      setClientPinValidated(false);
    }
    setClientPinInput('');
  };

  const clearClientPin = () => {
    setClientPinValidated(false);
    setClientPinInput('');
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

  const clientLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/client/event/${event.accessCode}`
      : `/client/event/${event.accessCode}`;

  const openQrCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      clientLink,
    )}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              {event.isActive ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
            {/* Client-view overlay: shown when a valid PIN is entered */}
            {clientPinValidated && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Client View - Photos</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setClientPinValidated(false)}>Close</Button>
                    </div>
                  </div>
                  {photos.length === 0 ? (
                    <div className="text-center py-12">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">No Photos Yet</h3>
                      <p className="text-muted-foreground">Upload photos to this event to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {photos.map((photo) => (
                        <div key={photo._id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => openPhoto(photo._id)}>
                          <div className="relative aspect-square">
                            <img src={thumbnails[photo._id] || api.getPublicThumbnailUrl(photo._id)} alt={photo.filename} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/events/${eventId}/edit`)}>
              Edit Event
            </Button>
            <Button variant="outline" onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{event.photoCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Access</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{event.clientAccessCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">
                {new Date(event.eventDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faces Detected</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {photos.reduce((sum, p) => sum + (p.faceCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Access Link */}
        <Card>
          <CardHeader>
            <CardTitle>Client Access</CardTitle>
            <CardDescription>
              Share this code with your clients so they can access their photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Access Code</div>
              <div className="flex items-center justify-between gap-4">
                <code className="text-2xl font-mono font-bold">{event.accessCode}</code>
                <Button variant="outline" onClick={copyAccessCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </div>
            {familyPins.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">Family PIN (share with family members)</div>
                <div className="flex gap-2 flex-wrap items-center">
                  {familyPins.map((p) => (
                    <div key={p} className="px-4 py-2 bg-white/5 rounded text-lg md:text-xl font-mono font-semibold">{p}</div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyClientLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Client Link
              </Button>
              <Button variant="outline" className="flex-1" onClick={openClientLink}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Client Portal
              </Button>
              <Button variant="outline" className="flex-1" onClick={openQrCode}>
                QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        <Tabs defaultValue="photos">
          <TabsList>
            <TabsTrigger value="photos">Photos ({event.photoCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="photos" className="space-y-4">
            {/* Upload */}
            <Card>
              <CardContent className="pt-6">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      // default to original for drag and drop
                      const syntheticEvent = {
                        target: {
                          files: files,
                          value: ''
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleFileUpload(syntheticEvent, false);
                    }
                  }}
                >
                  {uploading ? (
                    <div>
                      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
                      <p className="text-sm text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-4">
                        <div className="flex flex-col items-center">
                          <label
                            htmlFor="photo-upload-compressed"
                            className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-md font-medium transition-all shadow-sm active:scale-95"
                          >
                            Compress Photo Upload
                          </label>
                          <input
                            id="photo-upload-compressed"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileUpload(e, true)}
                            className="hidden"
                          />
                          <p className="text-xs text-muted-foreground mt-2 font-medium">Faster upload, optimized size</p>
                        </div>

                        <div className="hidden md:flex items-center text-muted-foreground font-semibold">
                          <div className="w-12 h-[1px] bg-gray-200 mr-3"></div>
                          OR
                          <div className="w-12 h-[1px] bg-gray-200 ml-3"></div>
                        </div>

                        <div className="flex flex-col items-center">
                          <label
                            htmlFor="photo-upload-original"
                            className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-md font-medium transition-all shadow-sm active:scale-95"
                          >
                            Original Photo Upload
                          </label>
                          <input
                            id="photo-upload-original"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileUpload(e, false)}
                            className="hidden"
                          />
                          <p className="text-xs text-muted-foreground mt-2 font-medium">Full resolution, original quality</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        or drag and drop multiple files to upload original photos
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isSelectionMode ? `${selectedPhotos.length} selected` : ''}
              </div>
              <div className="flex gap-2">
                {!isSelectionMode ? (
                  <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select Photos
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      disabled={photos.length === 0}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedPhotos.length === photos.length && photos.length > 0
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={selectedPhotos.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                    <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Photos Grid */}
            {photos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Photos Yet</h3>
                  <p className="text-muted-foreground">
                    Upload photos to this event to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {photos.map((photo) => (
                  <Card 
                    key={photo._id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => {
                      if (isSelectionMode) {
                        togglePhotoSelected(photo._id);
                      } else {
                        openPhoto(photo._id);
                      }
                    }}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={thumbnails[photo._id] || api.getPublicThumbnailUrl(photo._id)}
                        alt={photo.filename}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                      {isSelectionMode && (
                        <Checkbox
                          className="absolute top-2 left-2 z-10"
                          checked={selectedPhotos.includes(photo._id)}
                          onCheckedChange={(checked) =>
                            togglePhotoSelected(photo._id, Boolean(checked))
                          }
                        />
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
