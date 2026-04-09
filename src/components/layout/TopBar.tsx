import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Plus, ChevronDown, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface TopBarProps {
  sidebarCollapsed: boolean;
  variant?: 'default' | 'admin';
}

const TopBar = ({ sidebarCollapsed, variant = 'default' }: TopBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  // Pages where Upgrade Plan should not appear
  const hideUpgradePages = ['/features', '/demo', '/blog'];
  const shouldHideUpgrade = hideUpgradePages.includes(location.pathname);

  const handleSignOut = () => {
    logout();
    toast({
      title: 'Signed out',
      description: 'You have been signed out',
    });
    navigate('/login');
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 border-b z-30 flex items-center justify-between px-6 ${
        variant === 'admin' 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-background/80 backdrop-blur-xl border-border'
      }`}
      style={{ left: sidebarCollapsed ? 80 : 260 }}
    >
      {variant === 'default' && (
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search photos, albums, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-secondary border-border w-full"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`flex items-center gap-4 ${variant === 'admin' ? 'w-full justify-end' : ''}`}>
        {variant === 'default' && (
          <>
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </>
        )}

        {/* Upload Button */}
        { /* <Button asChild className="gradient-primary rounded-full">
          <Link to="/upload">
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Link>
        </Button> */}



        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
              <img
                src={
                  user?.avatar
                    ? `${api.getAvatarUrl(user.id)}?v=${encodeURIComponent((user as any)?.avatarFilename || '')}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || 'User'
                    )}&background=random&size=100`
                }
                alt={`${user?.name || 'User'} avatar`}
                className="w-8 h-8 rounded-full object-cover border border-border"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || 'User'
                  )}&background=random&size=100`;
                }}
              />
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>

          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-3 border-b border-border">
              <p className="font-medium">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            </div>
            {variant === 'default' && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/portfolio" className="cursor-pointer">View Portfolio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                {!shouldHideUpgrade && (
                  <DropdownMenuItem asChild>
                    <Link to="/pricing?from=upgrade" className="cursor-pointer">Upgrade Plan</Link>
                  </DropdownMenuItem>
                )}
              </>
            )}
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
