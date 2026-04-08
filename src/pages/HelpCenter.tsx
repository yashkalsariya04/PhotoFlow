import { useState } from 'react';
import { Search, HelpCircle, Book, Mail, MessageCircle } from 'lucide-react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: Book,
      articles: [
        'Creating your account',
        'Setting up your first event',
        'Uploading photos',
        'Organizing your gallery'
      ]
    },
    {
      title: 'Account & Billing',
      icon: HelpCircle,
      articles: [
        'Managing your subscription',
        'Updating payment methods',
        'Account settings',
        'Password reset'
      ]
    },
    {
      title: 'Features',
      icon: Book,
      articles: [
        'AI photo organization',
        'Face recognition',
        'Client portals',
        'Event management'
      ]
    },
    {
      title: 'Troubleshooting',
      icon: HelpCircle,
      articles: [
        'Upload issues',
        'Login problems',
        'Performance tips',
        'Common errors'
      ]
    }
  ];

  const popularArticles = [
    'How to create a client portal',
    'Setting up face recognition',
    'Bulk photo upload guide',
    'Event workflow best practices'
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Find answers to your questions and learn how to make the most of PhotoFlow.
        </p>
        
        {/* Search */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <button className="flex items-center gap-3 p-6 border border-border rounded-lg hover:bg-accent transition-colors">
            <MessageCircle className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with our support team</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-6 border border-border rounded-lg hover:bg-accent transition-colors">
            <Mail className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-sm text-muted-foreground">Get help via email</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-6 border border-border rounded-lg hover:bg-accent transition-colors">
            <Book className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground">Browse our docs</p>
            </div>
          </button>
        </div>
        
        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Popular Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {popularArticles.map((article, index) => (
              <button
                key={index}
                className="text-left p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <p className="font-medium">{article}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Categories */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <category.icon className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <button className="text-left text-muted-foreground hover:text-foreground transition-colors">
                        {article}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Contact Support */}
        <div className="mt-12 bg-secondary/50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help you 24/7
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
              Contact Support
            </button>
            <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors">
              Schedule a Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
