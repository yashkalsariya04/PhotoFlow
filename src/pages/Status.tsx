import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Activity, Server, Database, Wifi } from 'lucide-react';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';

const Status = () => {
  const [services, setServices] = useState([
    { name: 'API', status: 'operational', icon: Server, lastChecked: '2 minutes ago' },
    { name: 'Database', status: 'operational', icon: Database, lastChecked: '2 minutes ago' },
    { name: 'CDN', status: 'operational', icon: Wifi, lastChecked: '5 minutes ago' },
    { name: 'Photo Processing', status: 'operational', icon: Activity, lastChecked: '1 minute ago' }
  ]);

  const [incidents, setIncidents] = useState([
    {
      title: 'Scheduled Maintenance',
      description: 'We will be performing scheduled maintenance on our database servers.',
      status: 'scheduled',
      date: 'March 15, 2024',
      time: '2:00 AM - 4:00 AM EST'
    }
  ]);

  const uptime = {
    '30 days': 99.9,
    '90 days': 99.8,
    '12 months': 99.7
  };

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      setServices(prev => prev.map(service => ({
        ...service,
        lastChecked: 'Just now'
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      case 'maintenance': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'degraded': return AlertCircle;
      case 'down': return AlertCircle;
      case 'maintenance': return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Navbar showAuthButtons={true}/>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">System Status</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Real-time status of PhotoFlow services and infrastructure.
        </p>
        
        {/* Overall Status */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-12">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200">All Systems Operational</h2>
              <p className="text-green-700 dark:text-green-300">All services are functioning normally.</p>
            </div>
          </div>
        </div>
        
        {/* Service Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Service Status</h2>
          <div className="space-y-4">
            {services.map((service, index) => {
              const StatusIcon = getStatusIcon(service.status);
              return (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <service.icon className="w-6 h-6 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className={`text-sm ${getStatusColor(service.status)}`}>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last checked</p>
                      <p className="text-sm">{service.lastChecked}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Uptime Statistics */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Uptime Statistics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(uptime).map(([period, percentage]) => (
              <div key={period} className="border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">{percentage}%</div>
                <div className="text-sm text-muted-foreground">{period}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Incidents */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recent Incidents</h2>
          {incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div key={index} className="border border-border rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{incident.title}</h3>
                      <p className="text-muted-foreground mb-3">{incident.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>March 15, 2026</span>
                        <span>{incident.time}</span>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-border rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-muted-foreground">No recent incidents</p>
            </div>
          )}
        </div>
        
        {/* Subscribe to Updates */}
        <div className="bg-secondary/50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Subscribe to Status Updates</h2>
          <p className="text-muted-foreground mb-6">
            Get notified about service disruptions and maintenance windows.
          </p>
          <div className="flex gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
        
        {/* API Status Endpoint */}
        {/* <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">API Status Endpoint</h2>
          <div className="bg-secondary/50 rounded-lg p-6">
            <p className="font-mono text-sm mb-2">GET https://api.photoflow.com/status</p>
            <p className="text-muted-foreground text-sm">
              Use this endpoint to programmatically check the status of our services. 
              Returns a JSON object with the current status of all services.
            </p>
          </div>
        </div> */}
      </div>
      <Footer />
    </div>
  );
};

export default Status;
