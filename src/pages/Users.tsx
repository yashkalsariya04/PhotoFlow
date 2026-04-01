import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Trash2, User, Mail, Shield, Calendar, Ban, CheckCircle, Search, LayoutGrid, Grid3x3, List } from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive?: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: UserData) => {
    try {
      // Default to true if undefined
      const currentStatus = user.isActive !== false;
      const newStatus = !currentStatus;
      
      await api.updateUser(user.id, { isActive: newStatus });
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, isActive: newStatus } : u
      ));
    } catch (err) {
      alert('Failed to update user status');
      console.error(err);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert('Failed to delete user');
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Users Management</h1>
            <p className="text-muted-foreground">Manage all registered users in the system.</p>
          </div>
          <Button onClick={loadUsers} variant="outline" size="sm" disabled={loading}>
            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
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

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={loadUsers} className="text-destructive hover:bg-destructive/20">
              Try Again
            </Button>
          </div>
        )}

        {viewMode === 'list' ? (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                    <tr key={user.id} className={`hover:bg-muted/50 transition-colors ${user.isActive === false ? 'bg-muted/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.isActive === false ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {user.isActive === false ? <Ban className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border">
                        <Shield className="w-3 h-3" />
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={user.isActive !== false 
                            ? "text-orange-500 hover:text-orange-600 hover:bg-orange-100" 
                            : "text-green-500 hover:text-green-600 hover:bg-green-100"
                          }
                          onClick={() => toggleStatus(user)}
                        >
                          {user.isActive !== false ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          {user.isActive !== false ? "Rusticate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
            {users
              .filter(user => 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(user => (
                <Card key={user.id} className={`overflow-hidden ${user.isActive === false ? 'bg-muted/30' : ''}`}>
                  <div className={`p-4 ${viewMode === 'tiles' ? 'flex flex-col items-center text-center gap-2' : ''}`}>
                    <div className={`flex items-start justify-between ${viewMode === 'tiles' ? 'w-full' : 'mb-4'}`}>
                      <div className={`${viewMode === 'tiles' ? 'mx-auto mb-2' : 'flex items-center gap-3'}`}>
                        <div className={`rounded-full flex items-center justify-center ${viewMode === 'tiles' ? 'w-12 h-12' : 'w-10 h-10'} ${user.isActive === false ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {user.isActive === false ? <Ban className={viewMode === 'tiles' ? "w-6 h-6" : "w-5 h-5"} /> : <User className={viewMode === 'tiles' ? "w-6 h-6" : "w-5 h-5"} />}
                        </div>
                        {viewMode === 'grid' && (
                          <div>
                            <h3 className="font-semibold text-lg">{user.name}</h3>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        )}
                      </div>
                      {viewMode === 'grid' && (
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                      )}
                    </div>

                    {viewMode === 'tiles' && (
                      <div className="w-full mb-3">
                        <h3 className="font-semibold truncate">{user.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <Badge variant="secondary" className="mt-2 capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    )}

                    {viewMode === 'grid' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Calendar className="w-4 h-4" />
                        Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    )}

                    <div className={`flex ${viewMode === 'tiles' ? 'flex-col w-full gap-2' : 'items-center justify-between pt-4 border-t'}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-center ${user.isActive !== false 
                          ? "text-orange-500 hover:text-orange-600 hover:bg-orange-100" 
                          : "text-green-500 hover:text-green-600 hover:bg-green-100"
                        }`}
                        onClick={() => toggleStatus(user)}
                      >
                        {user.isActive !== false ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        {user.isActive !== false ? "Rusticate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Users;
