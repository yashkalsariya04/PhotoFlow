import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Bell, Mail, Shield, Key } from 'lucide-react';
import { FaceEnrollment } from '@/components/auth/FaceEnrollment';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your changes have been successfully saved.",
      });
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-1">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-1">Manage platform configurations and preferences.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-slate-950/80 border border-slate-800/80 rounded-xl">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card className="bg-slate-950/80 border-slate-800/80 text-slate-200 rounded-2xl shadow-[0_22px_60px_rgba(0,0,0,0.75)]">
              <CardHeader>
                <CardTitle>Platform Information</CardTitle>
                <CardDescription>General settings for the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input id="site-name" defaultValue="FaceMatrix" className="bg-slate-950 border-slate-700 text-slate-200" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" defaultValue="support@lumina.studio" className="bg-slate-950 border-slate-700 text-slate-200" />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">Temporarily disable access for users</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
             <Card className="bg-slate-950/80 border-slate-800/80 text-slate-200 rounded-2xl shadow-[0_22px_60px_rgba(0,0,0,0.75)]">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how and when you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-slate-500">Receive daily summaries</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-slate-500">Critical system health updates</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <FaceEnrollment />

            <Card className="bg-slate-950/80 border-slate-800/80 text-slate-200 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Account Security
                </CardTitle>
                <CardDescription>Manage your password and authentication methods.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" className="bg-slate-950 border-slate-700" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" className="bg-slate-950 border-slate-700" />
                </div>
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                  <Key className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
