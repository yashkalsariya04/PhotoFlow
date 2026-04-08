import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Play, ArrowRight, CheckCircle } from 'lucide-react';

const Demo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar showAuthButtons={true} />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              See PhotoFlow in <span className="gradient-text">action</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the power of AI-driven photo management with our interactive demo
            </p>
            <Button size="lg" className="gradient-primary">
              <Play className="w-5 h-5 mr-2" />
              Start Interactive Demo
            </Button>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: 'Smart Upload',
                description: 'Drag and drop photos and watch AI automatically tag and organize them',
                icon: 'Upload',
              },
              {
                title: 'Face Recognition',
                description: 'See how our AI identifies and groups people in your photos',
                icon: 'Users',
              },
              {
                title: 'Auto-Albums',
                description: 'Watch AI create intelligent albums based on events and locations',
                icon: 'Folder',
              },
              {
                title: 'Smart Search',
                description: 'Search photos using natural language or AI-generated tags',
                icon: 'Search',
              },
              {
                title: 'Client Sharing',
                description: 'Create secure galleries for clients with password protection',
                icon: 'Share',
              },
              {
                title: 'Batch Processing',
                description: 'Apply edits and watermark to hundreds of photos at once',
                icon: 'Zap',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl glass hover:bg-card/90 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <span className="text-primary-foreground font-bold">{feature.icon[0]}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-8 rounded-2xl glass gradient-border"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to try it yourself?</h2>
            <p className="text-muted-foreground mb-6">
              Start your free trial and upload up to 500 photos to experience all features
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="gradient-primary">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Schedule Live Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Demo;
