import { Shield, Lock, Eye, Key, AlertTriangle, CheckCircle, Server, Users } from 'lucide-react';

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All photos and data are encrypted both in transit and at rest using industry-standard AES-256 encryption.'
    },
    {
      icon: Key,
      title: 'Secure Authentication',
      description: 'Multi-factor authentication, password hashing, and secure session management protect your account.'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Our infrastructure is hosted in SOC 2 compliant data centers with 24/7 monitoring.'
    },
    {
      icon: Users,
      title: 'Access Controls',
      description: 'Granular permissions and role-based access ensure only authorized users can view your photos.'
    }
  ];

  const certifications = [
    { name: 'SOC 2 Type II', status: 'Compliant' },
    { name: 'GDPR', status: 'Compliant' },
    { name: 'CCPA', status: 'Compliant' },
    { name: 'ISO 27001', status: 'In Progress' }
  ];

  const bestPractices = [
    {
      title: 'Use Strong Passwords',
      description: 'Create unique, complex passwords and enable two-factor authentication.',
      icon: Key
    },
    {
      title: 'Regular Security Updates',
      description: 'Keep your browser and software updated to the latest versions.',
      icon: Shield
    },
    {
      title: 'Secure Client Access',
      description: 'Use unique access codes for each client and rotate them regularly.',
      icon: Lock
    },
    {
      title: 'Monitor Account Activity',
      description: 'Review your account login history and report suspicious activity.',
      icon: Eye
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Security at PhotoFlow</h1>
        <p className="text-xl text-muted-foreground mb-12">
          We're committed to protecting your photos and data with industry-leading security measures.
        </p>
        
        {/* Security Overview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-semibold">Enterprise-Grade Security</h2>
          </div>
          <p className="text-muted-foreground">
            PhotoFlow implements comprehensive security measures to protect your photos, client data, 
            and business information. Our security program includes regular audits, penetration testing, 
            and continuous monitoring.
          </p>
        </div>
        
        {/* Security Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">Security Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Data Protection */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">Data Protection</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Encryption Standards</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>AES-256 encryption for data at rest</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>TLS 1.3 for data in transit</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>End-to-end encryption for client portals</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Encrypted backups with secure key management</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Access Controls</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Role-based access control (RBAC)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Multi-factor authentication (MFA)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Session timeout and secure logout</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Audit logging and monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Certifications */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">Compliance & Certifications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <div key={index} className="border border-border rounded-lg p-4 text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  cert.status === 'Compliant' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <CheckCircle className={`w-6 h-6 ${
                    cert.status === 'Compliant' ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                </div>
                <h3 className="font-semibold mb-1">{cert.name}</h3>
                <p className="text-sm text-muted-foreground">{cert.status}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">Security Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {bestPractices.map((practice, index) => (
              <div key={index} className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <practice.icon className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">{practice.title}</h3>
                    <p className="text-sm text-muted-foreground">{practice.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Security Incident Response */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">Incident Response</h2>
          <div className="bg-secondary/50 rounded-lg p-6">
            <p className="mb-4">
              We maintain a comprehensive incident response program to quickly identify and address security issues:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>24/7 security monitoring and alerting</span>
              </li>
              <li className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Dedicated security response team</span>
              </li>
              <li className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Regular security drills and training</span>
              </li>
              <li className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Transparent communication for any incidents</span>
              </li>
            </ul>
          </div>
        </div>
        
        
        {/* Security Updates */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Stay Informed</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to our security newsletter to receive updates about security features, 
            best practices, and incident notifications.
          </p>
          <div className="flex gap-4 max-w-md">
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
      </div>
    </div>
  );
};

export default Security;
