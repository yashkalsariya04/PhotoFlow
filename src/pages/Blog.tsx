import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: '5 Ways AI is Revolutionizing Photography',
    excerpt: 'Discover how artificial intelligence is changing the way photographers work and deliver value to clients.',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'AI & Technology',
    image: 'blog-1.jpg',
  },
  {
    id: 2,
    title: 'Building a Client Portal That Actually Works',
    excerpt: 'Learn the best practices for creating client portals that streamline your photography business.',
    date: '2024-01-10',
    readTime: '7 min read',
    category: 'Business',
    image: 'blog-2.jpg',
  },
  {
    id: 3,
    title: 'Privacy-First Photo Management',
    excerpt: 'Why privacy matters in photo management and how to protect your clients\' data.',
    date: '2024-01-05',
    readTime: '6 min read',
    category: 'Security',
    image: 'blog-3.jpg',
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar showAuthButtons={false} />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Latest from the <span className="gradient-text">PhotoFlow blog</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tips, tutorials, and insights for professional photographers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="h-48 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6 group-hover:scale-105 transition-transform duration-300" />
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                    <span className="font-medium">Read more</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
