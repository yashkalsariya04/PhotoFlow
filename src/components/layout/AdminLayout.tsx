import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar sidebarCollapsed={collapsed} variant="admin" />
      <main 
        className={`flex-1 transition-all duration-300 pt-16 ${
          collapsed ? 'ml-20' : 'ml-[260px]'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
