import { Code, Copy, CheckCircle, AlertCircle, Book, Terminal, Zap, Shield } from 'lucide-react';
import { useState } from 'react';

const API = () => {
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/photos',
      description: 'Retrieve all photos for the authenticated user',
      parameters: [
        { name: 'page', type: 'number', description: 'Page number for pagination' },
        { name: 'limit', type: 'number', description: 'Number of photos per page' },
        { name: 'tags', type: 'string', description: 'Filter by tags (comma-separated)' }
      ],
      example: `curl -X GET "https://api.photoflow.com/api/v1/photos?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      method: 'POST',
      path: '/api/v1/photos/upload',
      description: 'Upload a new photo to your account',
      parameters: [
        { name: 'file', type: 'file', description: 'Photo file to upload' },
        { name: 'tags', type: 'string', description: 'Tags for the photo (optional)' },
        { name: 'album_id', type: 'string', description: 'Album ID to add photo to (optional)' }
      ],
      example: `curl -X POST "https://api.photoflow.com/api/v1/photos/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@photo.jpg" \\
  -F "tags=wedding,outdoor"`
    },
    {
      method: 'GET',
      path: '/api/v1/albums',
      description: 'Retrieve all albums for the authenticated user',
      parameters: [
        { name: 'page', type: 'number', description: 'Page number for pagination' },
        { name: 'limit', type: 'number', description: 'Number of albums per page' }
      ],
      example: `curl -X GET "https://api.photoflow.com/api/v1/albums" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      method: 'POST',
      path: '/api/v1/albums',
      description: 'Create a new album',
      parameters: [
        { name: 'name', type: 'string', description: 'Album name' },
        { name: 'description', type: 'string', description: 'Album description (optional)' },
        { name: 'private', type: 'boolean', description: 'Whether album is private (default: false)' }
      ],
      example: `curl -X POST "https://api.photoflow.com/api/v1/albums" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Wedding Photos",
    "description": "Beautiful wedding ceremony photos",
    "private": true
  }'`
    }
  ];

  const authentication = {
    apiKey: 'sk_photoflow_1234567890abcdef',
    bearerToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  };

  const rateLimits = [
    { tier: 'Free', requests: '1,000', window: 'per hour' },
    { tier: 'Pro', requests: '10,000', window: 'per hour' },
    { tier: 'Enterprise', requests: '100,000', window: 'per hour' }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">PhotoFlow API</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Build powerful integrations with our RESTful API to manage photos, albums, and client portals programmatically.
        </p>
        
        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-semibold">Quick Start</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">1. Get Your API Key</h3>
              <p className="text-sm text-muted-foreground">Generate an API key from your account settings.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Authenticate</h3>
              <p className="text-sm text-muted-foreground">Include your API key in the Authorization header.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Make Requests</h3>
              <p className="text-sm text-muted-foreground">Start making API calls to manage your photos.</p>
            </div>
          </div>
        </div>
        
        {/* Authentication */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Authentication</h2>
          <div className="border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">API Key Authentication</h3>
            <p className="text-muted-foreground mb-4">
              All API requests must include your API key in the Authorization header:
            </p>
            <div className="bg-background rounded-lg p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span>Authorization: Bearer YOUR_API_KEY</span>
                <button
                  onClick={() => handleCopy('Authorization: Bearer YOUR_API_KEY')}
                  className="text-primary hover:underline"
                >
                  {copiedCode === 'Authorization: Bearer YOUR_API_KEY' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Sample API Key</h3>
              <div className="bg-background rounded p-3 font-mono text-sm mb-3">
                {authentication.apiKey}
              </div>
              <p className="text-sm text-muted-foreground">
                Use this format for your API key. Get your actual key from account settings.
              </p>
            </div>
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Security Notes</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Keep your API key secret and secure</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Use HTTPS for all API requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Regenerate keys regularly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">API Endpoints</h2>
          <div className="space-y-8">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-secondary/50 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded text-sm font-mono ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-muted-foreground">{endpoint.description}</p>
                </div>
                
                <div className="p-4">
                  <h4 className="font-semibold mb-3">Parameters</h4>
                  <div className="space-y-2 mb-4">
                    {endpoint.parameters.map((param, paramIndex) => (
                      <div key={paramIndex} className="flex items-center gap-4 text-sm">
                        <code className="bg-secondary px-2 py-1 rounded">{param.name}</code>
                        <span className="text-muted-foreground">({param.type})</span>
                        <span>{param.description}</span>
                      </div>
                    ))}
                  </div>
                  
                  <h4 className="font-semibold mb-3">Example</h4>
                  <div className="relative">
                    <pre className="bg-background rounded-lg p-4 text-sm overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                    <button
                      onClick={() => handleCopy(endpoint.example)}
                      className="absolute top-2 right-2 text-primary hover:underline"
                    >
                      {copiedCode === endpoint.example ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Rate Limits */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Rate Limits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {rateLimits.map((limit, index) => (
              <div key={index} className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">{limit.tier}</h3>
                <div className="text-2xl font-bold mb-2">{limit.requests}</div>
                <div className="text-sm text-muted-foreground">{limit.window}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold">Rate Limit Headers</span>
            </div>
            <p className="text-sm text-muted-foreground">
              All API responses include rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset.
            </p>
          </div>
        </div>
        
        {/* Response Format */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Response Format</h2>
          <div className="border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Success Response</h3>
            <pre className="bg-background rounded-lg p-4 text-sm mb-6">
              <code>{`{
  "success": true,
  "data": {
    // Response data here
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}`}</code>
            </pre>
            
            <h3 className="font-semibold mb-4">Error Response</h3>
            <pre className="bg-background rounded-lg p-4 text-sm">
              <code>{`{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid",
    "details": {}
  }
}`}</code>
            </pre>
          </div>
        </div>
        
        {/* SDKs and Libraries */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">SDKs & Libraries</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6">
              <Terminal className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Node.js</h3>
              <p className="text-sm text-muted-foreground mb-3">Official Node.js SDK</p>
              <code className="text-xs bg-secondary px-2 py-1 rounded">npm install photoflow-sdk</code>
            </div>
            <div className="border border-border rounded-lg p-6">
              <Terminal className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Python</h3>
              <p className="text-sm text-muted-foreground mb-3">Official Python SDK</p>
              <code className="text-xs bg-secondary px-2 py-1 rounded">pip install photoflow-python</code>
            </div>
            <div className="border border-border rounded-lg p-6">
              <Terminal className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Ruby</h3>
              <p className="text-sm text-muted-foreground mb-3">Community Ruby gem</p>
              <code className="text-xs bg-secondary px-2 py-1 rounded">gem install photoflow</code>
            </div>
          </div>
        </div>
        
        {/* Support */}
        <div className="bg-secondary/50 rounded-lg p-8 text-center">
          <Book className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Check out our API documentation, join our developer community, or contact our support team.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
              View Full Documentation
            </button>
            <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default API;
