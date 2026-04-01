import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RotateCcw, Trash2, Mail, Shield, Calendar, Ban, CheckCircle, Search, LayoutGrid, Grid3x3, List, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive?: boolean;
  avatarFilename?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState("list");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aDate - bDate;
  });

  const generatePassword = (length: number = 10) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      result += chars[idx];
    }
    return result;
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Name and email are required');
      return;
    }
    try {
      setCreatingUser(true);
      setCreatedPassword(null);
      const password = generatePassword();
      const registerResult = await api.adminRegisterUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password,
      });
      const userId = registerResult.user.id;
      if (newUserRole !== 'user') {
        await api.updateUser(userId, { role: newUserRole });
      }
      try {
        await api.sendPasswordEmail({ email: newUserEmail.trim(), password });
      } catch (emailError) {
        console.error('Error sending password email during user creation:', emailError);
      }
      setUsers(prev => [...prev, {
        id: registerResult.user.id,
        name: registerResult.user.name,
        email: registerResult.user.email,
        role: newUserRole,
        createdAt: registerResult.user.createdAt,
        isActive: true,
        avatarFilename: registerResult.user.avatarFilename,
      }]);
      setCreatedPassword(password);
      setCreatedEmail(newUserEmail.trim());
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('user');
      setShowCreateUser(false);
    } catch (err) {
      console.error('Error creating user:', err);
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">Users Management</h1>
            <p className="text-slate-400">Manage all registered users in the system.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateUser(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Button
              onClick={loadUsers}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={loadUsers} className="text-red-400 hover:bg-red-500/20">
              Try Again
            </Button>
          </div>
        )}

        {viewMode === 'list' ? (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-[0_22px_60px_rgba(0,0,0,0.75)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800/70">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wide uppercase">User</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wide uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wide uppercase">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wide uppercase">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wide uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-slate-900/70 transition-colors ${user.isActive === false ? 'bg-red-900/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 border-2 ${user.isActive === false ? 'border-red-500/20' : 'border-slate-700/80'} shadow-sm`}>
                          {user.avatarFilename && (
                            <AvatarImage src={api.getAvatarUrl(user.id, user.avatarFilename)} alt={user.name} />
                          )}
                          <AvatarFallback className={user.isActive === false ? 'bg-red-900/20 text-red-400' : 'bg-indigo-900/20 text-indigo-400'}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-200">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive !== false ? "outline" : "destructive"} className={user.isActive !== false ? "border-green-500/50 text-green-500 bg-green-500/10" : ""}>
                        {user.isActive !== false ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`capitalize ${user.role === 'admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' : 'border-slate-700 text-slate-400'}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                            <DropdownMenuItem onClick={() => toggleStatus(user)} className={user.isActive !== false ? "text-orange-400 focus:text-orange-400 focus:bg-orange-400/10" : "text-green-400 focus:text-green-400 focus:bg-green-400/10"}>
                              {user.isActive !== false ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                              {user.isActive !== false ? "Rusticate User" : "Activate User"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-400 focus:text-red-400 focus:bg-red-400/10">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
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
            {sortedUsers.map(user => (
                <Card
                  key={user.id}
                  className={`overflow-hidden bg-slate-950/80 border-slate-800/80 rounded-2xl transition-all hover:border-slate-700 shadow-[0_22px_60px_rgba(0,0,0,0.75)] ${user.isActive === false ? 'bg-red-900/5 border-red-900/20' : ''}`}
                >
                  <div className={`p-4 ${viewMode === 'tiles' ? 'flex flex-col items-center text-center gap-3' : ''}`}>
                    <div className={`flex items-start justify-between ${viewMode === 'tiles' ? 'w-full absolute top-2 right-2' : 'mb-4'}`}>
                       {viewMode === 'grid' && (
                        <div className="flex items-center gap-3">
                           <Avatar className={`h-12 w-12 border-2 ${user.isActive === false ? 'border-red-500/20' : 'border-slate-700/80'} shadow-sm`}>
                            {user.avatarFilename && (
                              <AvatarImage src={api.getAvatarUrl(user.id, user.avatarFilename)} alt={user.name} />
                            )}
                            <AvatarFallback className={user.isActive === false ? 'bg-red-900/20 text-red-400' : 'bg-indigo-900/20 text-indigo-400'}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-200">{user.name}</h3>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                       )}
                       
                       {viewMode === 'grid' && (
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 -mr-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                             <DropdownMenuItem onClick={() => toggleStatus(user)} className={user.isActive !== false ? "text-orange-400" : "text-green-400"}>
                              {user.isActive !== false ? "Rusticate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-400">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                       )}
                    </div>

                    {viewMode === 'tiles' && (
                      <>
                        <div className="mt-4 relative">
                           <Avatar className={`h-16 w-16 border-2 ${user.isActive === false ? 'border-red-500/20' : 'border-slate-700/80'} shadow-sm`}>
                            {user.avatarFilename && (
                              <AvatarImage src={api.getAvatarUrl(user.id, user.avatarFilename)} alt={user.name} />
                            )}
                            <AvatarFallback className={`text-xl ${user.isActive === false ? 'bg-red-900/20 text-red-400' : 'bg-indigo-900/20 text-indigo-400'}`}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          {user.isActive === false && (
                            <div className="absolute -bottom-1 -right-1 bg-red-900 text-red-200 text-[10px] px-1.5 py-0.5 rounded-full border border-red-700">
                              Suspended
                            </div>
                          )}
                        </div>
                        <div className="w-full">
                          <h3 className="font-semibold truncate text-slate-200">{user.name}</h3>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <div className="flex items-center justify-center gap-2 mt-2">
                             <Badge variant="outline" className={`capitalize text-[10px] h-5 ${user.role === 'admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' : 'border-slate-700 text-slate-400'}`}>
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full mt-2">
                           <Button
                              variant="ghost"
                              size="sm"
                              className={`flex-1 h-8 text-xs ${user.isActive !== false 
                                ? "text-orange-400 hover:bg-orange-400/10" 
                                : "text-green-400 hover:bg-green-400/10"
                              }`}
                              onClick={() => toggleStatus(user)}
                            >
                              {user.isActive !== false ? "Suspend" : "Activate"}
                            </Button>
                        </div>
                      </>
                    )}

                    {viewMode === 'grid' && (
                      <>
                        <div className="flex items-center gap-4 mb-4">
                           <Badge variant={user.isActive !== false ? "outline" : "destructive"} className={user.isActive !== false ? "border-green-500/50 text-green-500 bg-green-500/10" : ""}>
                            {user.isActive !== false ? "Active" : "Suspended"}
                          </Badge>
                          <Badge variant="outline" className={`capitalize ${user.role === 'admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' : 'border-slate-700 text-slate-400'}`}>
                            {user.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}
        <Dialog open={showCreateUser} onOpenChange={(open) => {
          setShowCreateUser(open);
          if (!open) {
            setNewUserName('');
            setNewUserEmail('');
            setCreatedPassword(null);
            setCreatedEmail(null);
          }
        }}>
          <DialogContent className="bg-slate-950/80 border-slate-800/80 rounded-2xl shadow-[0_22px_60px_rgba(0,0,0,0.75)]">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Add New User</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter the user&apos;s details. A password will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Full Name</p>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter full name"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Gmail / Email Address</p>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Role</p>
                <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as 'user' | 'admin')}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createdPassword && (
                <div className="mt-2 p-3 rounded-md bg-slate-800 border border-slate-700 space-y-2">
                  <p className="text-xs text-slate-400">Generated Password (share with user):</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-slate-100 break-all flex-1 mr-2">
                      {createdPassword}
                    </p>
                  </div>
                  {createdEmail && (
                    <p className="text-[11px] text-slate-400">
                      Password has been emailed to: <span className="text-slate-200">{createdEmail}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateUser(false)}
                className="border-slate-700 text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
