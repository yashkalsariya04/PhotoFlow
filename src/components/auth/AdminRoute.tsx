import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
            <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Access Denied</h1>
            <p className="text-slate-400 mb-8">You do not have permission to view this page.</p>
            <a href="/dashboard" className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                Return to Dashboard
            </a>
        </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
