import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

import { motion } from 'framer-motion';
import { Sparkles, FolderKanban, Share2, Shield, Zap, Cloud } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Auto-Tagging',
    description: 'Our advanced AI analyzes your photos and automatically adds relevant tags, making every image instantly searchable.',
  },
  {
    icon: FolderKanban,
    title: 'Smart Albums',
    description: 'Let AI organize your photos into beautiful albums based on events, locations, people, and visual themes.',
  },
  {
    icon: Share2,
    title: 'Instant Sharing',
    description: 'Create stunning galleries with one click. Share with clients via secure links or embed directly on your website.',
  },
  {
    icon: Shield,
    title: 'Privacy Controls',
    description: 'Full control over who sees your work. Password protection, download permissions, and expiring links.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Upload thousands of RAW files effortlessly. Our infrastructure handles high-resolution images at blazing speed.',
  },
  {
    icon: Cloud,
    title: 'Secure Storage',
    description: 'Enterprise-grade security with automatic backups. Your photos are safe, always accessible, and never compressed.',
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar showAuthButtons={true}/>
      <main className="pt-24 pb-16 px-4">
        <section className="px-4 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
          
          <div className="container mx-auto relative z-10">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Everything you need to <span className="gradient-text">shine</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed specifically for professional photographers
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="h-full p-8 rounded-2xl glass hover:bg-card/90 transition-all duration-300 hover-lift">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-primary-foreground" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
};

export default Features;
