import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, HardDrive, Sparkles, Shield, CreditCard, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dashboardStats } from '@/data/mockData';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FaceEnrollmentModal } from '@/components/auth/FaceEnrollmentModal';
import { ScanFace, CheckCircle2 } from 'lucide-react';
import StorageWidget from '@/components/dashboard/StorageWidget';

const sections = [
  { id: 'profile', icon: User, label: 'Profile & Branding' },
  { id: 'storage', icon: HardDrive, label: 'Storage' },
  { id: 'ai', icon: Sparkles, label: 'AI Preferences' },
  { id: 'privacy', icon: Shield, label: 'Privacy & Security' },
  { id: 'billing', icon: CreditCard, label: 'Billing' },
];

const Settings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<any>(null);
  const { refreshUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string>('https://ui-avatars.com/api/?name=User&background=random');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [isFaceEnrollOpen, setIsFaceEnrollOpen] = useState(false);
  const [hasFaceEnrolled, setHasFaceEnrolled] = useState(false);
  const [removingFace, setRemovingFace] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
        setName(userData.name);
        setEmail(userData.email);
        setDesignation(userData.designation || '');
        setLocation(userData.location || '');
        setHasFaceEnrolled(!!userData.faceEmbedding);

        
        // Set initial placeholder with user's name
        setAvatarPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&size=200`);
        
        // Try to load real avatar if it exists
        if (userData.avatar && userData.id) {
          try {
            const blob = await api.getAvatarBlob(userData.id);
            const url = URL.createObjectURL(blob);
            setAvatarPreview(url);
          } catch (e) {
            console.error('Failed to load avatar:', e);
            // Keep placeholder on error
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleRemoveFace = async () => {
    if (!confirm('Are you sure you want to remove your face enrollment? You will no longer be able to login with face recognition.')) {
      return;
    }

    setRemovingFace(true);
    try {
      await api.removeFaceEnrollment();
      setHasFaceEnrolled(false);
    } catch (err) {
      console.error('Failed to remove face enrollment:', err);
    } finally {
      setRemovingFace(false);
    }
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      setPhotosLoading(true);
      try {
        const photosData = await api.getPhotos({ limit: 100 });
        console.log('Photos data:', photosData);
        
        // Handle different response formats
        let photosList = [];
        if (Array.isArray(photosData)) {
          photosList = photosData;
        } else if (photosData && Array.isArray(photosData.data)) {
          photosList = photosData.data;
        } else if (photosData && Array.isArray(photosData.photos)) {
          photosList = photosData.photos;
        }
        
        console.log('Processed photos:', photosList);
        setPhotos(photosList);
      } catch (error) {
        console.error('Failed to fetch photos:', error);
        setPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };
    fetchPhotos();
  }, []);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('email', email);
      form.append('designation', designation);
      form.append('location', location);
      if (selectedFile) form.append('avatar', selectedFile);
      const result = await api.updateProfile(form);

      // if avatar updated, fetch blob and set preview using authenticated request
      if (result && result.id) {
        // refresh global auth user so TopBar reflects updated name/avatar
        await refreshUser();
        try {
          const blob = await api.getAvatarBlob(result.id);
          const url = URL.createObjectURL(blob);
          setAvatarPreview(url);
          setSelectedFile(null);
        } catch (e) {
          // Show placeholder with new name if upload fails
          setAvatarPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`);
          setSelectedFile(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      // revoke object URL on unmount if we created one
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl glass space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile & Branding</h2>
          </div>
          <div className="flex items-center gap-6">
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-secondary animate-pulse" />
            ) : (
              <img 
                src={avatarPreview}
                alt={name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" 
                onError={(e) => {
                  console.error('Image failed to load');
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
                }}
              />
            )}
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setSelectedFile(f);
                  const url = URL.createObjectURL(f);
                  setAvatarPreview(url);
                }}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary" /></div>
            <div className="space-y-2"><Label>Designation</Label><Input value={designation} onChange={(e) => setDesignation(e.target.value)} className="bg-secondary" placeholder="e.g., Professional Photographer" /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-secondary" placeholder="e.g., Ahmedabad, India"/></div>
          </div>
        </motion.div>

        {/* Storage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StorageWidget />
        </motion.div>

        {/* AI Preferences */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl glass space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="font-medium">Auto-tagging</p><p className="text-sm text-muted-foreground">Automatically tag uploaded photos</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="font-medium">Face Detection</p><p className="text-sm text-muted-foreground">Detect and group faces in photos</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="font-medium">Smart Albums</p><p className="text-sm text-muted-foreground">Create albums from similar photos</p></div><Switch defaultChecked /></div>
          </div>
        </motion.div>

        {/* Privacy & Security */}
        {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-2xl glass space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Privacy & Security</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                  <ScanFace className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Permanent Facial ID</p>
                  <p className="text-sm text-muted-foreground">Securely enrolled for instant passwordless login.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {hasFaceEnrolled ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Permanently Enrolled
                  </div>
                ) : (
                  <div className="text-xs font-medium text-amber-400/90 bg-amber-400/5 px-3 py-1.5 rounded-full border border-amber-400/15 uppercase tracking-wider">
                    Ready for Enrollment
                  </div>
                )}
                <div className="flex items-center gap-2 ml-2">
                  <Button 
                    variant={hasFaceEnrolled ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsFaceEnrollOpen(true)}
                    className={!hasFaceEnrolled ? "gradient-primary border-0 font-bold" : "border-slate-700 hover:bg-slate-800"}
                  >
                    {hasFaceEnrolled ? "Update ID" : "Start Setup"}
                  </Button>
                  
                  {hasFaceEnrolled && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveFace}
                      disabled={removingFace}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
                      title="Remove facial data"
                    >
                      {removingFace ? "Removing..." : "Remove"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div> */}
        
        <Button className="gradient-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <FaceEnrollmentModal 
        isOpen={isFaceEnrollOpen} 
        onClose={() => setIsFaceEnrollOpen(false)}
        onSuccess={() => setHasFaceEnrolled(true)}
      />
    </DashboardLayout>
  );
};

export default Settings;
