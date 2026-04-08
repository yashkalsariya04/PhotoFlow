import { Users, MessageCircle, Trophy, Calendar, Star, Heart } from 'lucide-react';

const Community = () => {
  const features = [
    {
      icon: Users,
      title: 'Photographer Forums',
      description: 'Connect with thousands of photographers worldwide. Share tips, get feedback, and learn from the community.'
    },
    {
      icon: MessageCircle,
      title: 'Monthly Meetups',
      description: 'Join our virtual and in-person meetups to network with fellow photographers and industry experts.'
    },
    {
      icon: Trophy,
      title: 'Photo Contests',
      description: 'Participate in monthly photo contests with prizes and recognition from the community.'
    },
    {
      icon: Calendar,
      title: 'Workshops & Events',
      description: 'Attend exclusive workshops and events led by professional photographers and PhotoFlow experts.'
    }
  ];

  const stats = [
    { label: 'Active Members', value: '5,000+', icon: Users },
    { label: 'Monthly Discussions', value: '2,500+', icon: MessageCircle },
    { label: 'Photos Shared', value: '50,000+', icon: Star },
    { label: 'Events Hosted', value: '100+', icon: Calendar }
  ];

  const recentActivity = [
    {
      type: 'discussion',
      title: 'Best practices for event photography',
      author: 'Sarah Chen',
      replies: 23,
      time: '2 hours ago'
    },
    {
      type: 'photo',
      title: 'Golden hour portrait session',
      author: 'Mike Johnson',
      likes: 145,
      time: '4 hours ago'
    },
    {
      type: 'event',
      title: 'Virtual Workshop: AI Photo Editing',
      author: 'PhotoFlow Team',
      attendees: 89,
      time: '1 day ago'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">PhotoFlow Community</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Join a thriving community of photographers who are passionate about their craft and leveraging technology to grow their business.
        </p>
        
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <stat.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">What Our Community Offers</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
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
            ))}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-8">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {activity.author} · {activity.time}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {activity.replies && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {activity.replies} replies
                        </span>
                      )}
                      {activity.likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {activity.likes} likes
                        </span>
                      )}
                      {activity.attendees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {activity.attendees} attending
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-primary hover:underline">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Join Community */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Join Our Community Today</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get access to exclusive content, connect with fellow photographers, and take your photography business to the next level.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
              Join for Free
            </button>
            <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors">
              Learn More
            </button>
          </div>
        </div>
        
        {/* Community Guidelines */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">Community Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Be Respectful</h3>
              <p className="text-muted-foreground">Treat all community members with respect and kindness, regardless of their skill level or background.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Share Knowledge</h3>
              <p className="text-muted-foreground">Help others learn by sharing your experiences, tips, and constructive feedback.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Stay On Topic</h3>
              <p className="text-muted-foreground">Keep discussions relevant to photography, PhotoFlow, and related topics.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">No Spam</h3>
              <p className="text-muted-foreground">Avoid posting promotional content, duplicate posts, or irrelevant links.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
