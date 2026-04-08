import { useState } from 'react';
import { Play, BookOpen, Clock, Star, Filter } from 'lucide-react';

const Tutorials = () => {
  const tutorials = [
    {
      title: 'Getting Started with PhotoFlow',
      description: 'Learn the basics of setting up your account and organizing your first photos.',
      duration: '15 min',
      level: 'Beginner',
      thumbnail: 'https://via.placeholder.com/300x200?text=Getting+Started',
      rating: 4.8,
      views: '2.3k',
      category: 'basics'
    },
    {
      title: 'Advanced AI Photo Organization',
      description: 'Master the AI-powered features to automatically categorize and tag your photos.',
      duration: '25 min',
      level: 'Advanced',
      thumbnail: 'https://via.placeholder.com/300x200?text=AI+Organization',
      rating: 4.9,
      views: '1.8k',
      category: 'ai'
    },
    {
      title: 'Creating Client Portals',
      description: 'Step-by-step guide to setting up beautiful client portals for photo delivery.',
      duration: '20 min',
      level: 'Intermediate',
      thumbnail: 'https://via.placeholder.com/300x200?text=Client+Portals',
      rating: 4.7,
      views: '3.1k',
      category: 'client'
    },
    {
      title: 'Event Photography Workflow',
      description: 'Complete workflow for managing events from booking to final delivery.',
      duration: '30 min',
      level: 'Intermediate',
      thumbnail: 'https://via.placeholder.com/300x200?text=Event+Workflow',
      rating: 4.9,
      views: '2.7k',
      category: 'events'
    },
    {
      title: 'Face Recognition Setup',
      description: 'Configure and use face recognition to automatically identify people in your photos.',
      duration: '18 min',
      level: 'Intermediate',
      thumbnail: 'https://via.placeholder.com/300x200?text=Face+Recognition',
      rating: 4.6,
      views: '1.5k',
      category: 'ai'
    },
    {
      title: 'Bulk Upload Techniques',
      description: 'Learn efficient methods for uploading and organizing large photo collections.',
      duration: '12 min',
      level: 'Beginner',
      thumbnail: 'https://via.placeholder.com/300x200?text=Bulk+Upload',
      rating: 4.5,
      views: '2.1k',
      category: 'basics'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Tutorials' },
    { id: 'basics', label: 'Basics' },
    { id: 'ai', label: 'AI Features' },
    { id: 'client', label: 'Client Management' },
    { id: 'events', label: 'Event Photography' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTutorials = selectedCategory === 'all' 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">PhotoFlow Tutorials</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Learn how to make the most of PhotoFlow with our comprehensive video tutorials and guides.
        </p>
        
        {/* Featured Tutorial */}
        {/* <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium">Featured Tutorial</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Complete PhotoFlow Mastery Course</h2>
              <p className="text-muted-foreground mb-6">
                A comprehensive 2-hour course covering everything from basics to advanced features. 
                Perfect for photographers who want to master PhotoFlow.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  2 hours
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4" />
                  4.9 rating
                </span>
                <span className="text-sm">5.2k views</span>
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch Now
              </button>
            </div>
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
              <Play className="w-16 h-16 text-muted-foreground" />
            </div>
          </div>
        </div>
         */}
        {/* Category Filter */}
        <div className="flex items-center gap-4 mb-8">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tutorial Grid */}
        {/* <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredTutorials.map((tutorial, index) => (
            <div key={index} className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-secondary relative">
                <img 
                  src={tutorial.thumbnail} 
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/80 hover:text-white transition-colors" />
                </div>
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {tutorial.duration}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {tutorial.level}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3" />
                    {tutorial.rating}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{tutorial.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{tutorial.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{tutorial.views} views</span>
                  <button className="text-primary hover:underline">Watch Tutorial</button>
                </div>
              </div>
            </div>
          ))}
        </div> */}
        
        {/* Learning Paths */}
        <div>
          <h2 className="text-2xl font-semibold mb-8">Learning Paths</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Beginner Path</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start your PhotoFlow journey with the fundamentals.
              </p>
              {/* <ul className="text-sm space-y-1 mb-4">
                <li>6 tutorials</li>
                <li>1.5 hours total</li>
                <li>Certificate of completion</li>
              </ul> */}
              <button className="text-primary hover:underline text-sm">Start Path</button>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Professional Path</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Advanced techniques for professional photographers.
              </p>
              {/* <ul className="text-sm space-y-1 mb-4">
                <li>8 tutorials</li>
                <li>3 hours total</li>
                <li>Certificate of completion</li>
              </ul> */}
              <button className="text-primary hover:underline text-sm">Start Path</button>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Business Path</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Grow your photography business with PhotoFlow.
              </p>
              {/* <ul className="text-sm space-y-1 mb-4">
                <li>5 tutorials</li>
                <li>2 hours total</li>
                <li>Certificate of completion</li>
              </ul> */}
              <button className="text-primary hover:underline text-sm">Start Path</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;
