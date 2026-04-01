import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  ShieldCheck,
  Database,
  ScanFace
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Calendar, label: 'Events', href: '/admin/events' },
  { icon: Database, label: 'Event Data', href: '/admin/event-data' },
  // { icon: ScanFace, label: 'AI Faces', href: '/admin/face-recognition' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
        await logout();
        navigate('/login');
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 bg-slate-950/95 border-r border-slate-900/80 z-40 flex flex-col shadow-[0_22px_60px_rgba(0,0,0,0.85)] backdrop-blur"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <span className="text-lg font-bold text-slate-50 tracking-tight">FaceMatrix</span>
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-[0.18em]">Admin Panel</span>
            </motion.div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-slate-500 hover:text-slate-100 hover:bg-slate-900/80"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-sm',
                    isActive
                      ? 'bg-emerald-500/90 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-100'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-emerald-400'
                    )}
                  />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium tracking-tight"
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

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
          {/* Add logout or user profile here if needed */}
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
