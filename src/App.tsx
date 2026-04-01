import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Albums from "./pages/Albums";
import Gallery from "./pages/Gallery";
import Portfolio from "./pages/Portfolio";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import EditEvent from "./pages/EditEvent";
import ClientPortal from "./pages/ClientPortal";
import ClientEventAccess from "./pages/ClientEventAccess";
import ClientPhotos from "./pages/ClientPhotos";
import GhibliStudio from "@/pages/GhibliStudio";
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Admin Imports
import AdminRoute from "@/components/auth/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminEventData from "./pages/admin/AdminEventData";
import AdminFaceRecognition from "./pages/admin/AdminFaceRecognition";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme" attribute="class">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/:eventId" element={<EventDetail />} />
              <Route path="/events/:eventId/edit" element={<EditEvent />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/event-data" element={<AdminEventData />} />
              {/* <Route path="/admin/face-recognition" element={<AdminFaceRecognition />} /> */}
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Event Management Routes (Photographer) */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/create" element={<CreateEvent />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/events/:eventId/edit" element={<EditEvent />} />
            
            {/* Client Portal Routes */}
            <Route path="/client" element={<ClientPortal />} />
            <Route path="/client/event/:accessCode" element={<ClientEventAccess />} />
            <Route path="/client/photos/:accessId" element={<ClientPhotos />} />
            <Route path="/ghibli-studio" element={<GhibliStudio />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
