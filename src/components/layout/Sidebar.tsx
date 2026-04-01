import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  FolderKanban,
  Tags,
  Share2,
  BarChart3,
  Settings,
  Camera,
  LogOut,
  ChevronLeft,
  User,
  Users,
  Calendar,
  Database,
  GalleryHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Events', href: '/events' },
 // { icon: Upload, label: 'Uploads', href: '/upload' },
  { icon: FolderKanban, label: 'Albums', href: '/albums' },
  //{ icon: Tags, label: 'AI Tags', href: '/tags' },
  { icon: GalleryHorizontal, label: 'Gallery', href: '/gallery' },,
 // { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: User, label: 'Portfolio', href: '/portfolio' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: Database, label: 'Event Data', href: '/event-data' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getHref = (item: typeof navItems[0]) => {
    if (user?.role === 'admin') {
      switch (item.label) {
        case 'Dashboard': return '/admin';
        case 'Users': return '/admin/users';
        case 'Event Data': return '/admin/event-data';
        case 'Events': return '/admin/events';
        case 'Settings': return '/admin/settings';
        default: return item.href;
      }
    }
    return item.href;
  };

  const filteredNavItems = navItems.filter(item => {
    // Users page is only for admins
    if ((item.label === 'Users' || item.label === 'Event Data') && user?.role !== 'admin') {
      return false;
    }

    if (user?.role === 'admin') {
      return ['Dashboard', 'Users', 'Event Data', 'Settings'].includes(item.label);
    }
    return true;
  });

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-40 flex flex-col"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Camera className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold text-sidebar-foreground"
            >
              PhotoFlow
            </motion.span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const href = getHref(item);
            const isActive = location.pathname === href || (href !== '/admin' && href !== '/dashboard' && location.pathname.startsWith(href));
            return (
              <li key={item.href}>
                <Link
                  to={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          {user?.id ? (
            
            <img
              src={
                user?.avatar
                  ? `${api.getAvatarUrl(user.id)}?v=${encodeURIComponent((user as any)?.avatarFilename || '')}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=100`
              }
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-sidebar-border"
              onError={(e) => {
                console.error('Image failed to load');
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=100`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
          )}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'Loading...'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Pro Plan</p>
            </motion.div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/portfolio')}
              className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
              title="View Portfolio"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
