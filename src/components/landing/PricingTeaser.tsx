import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const highlights = [
  'Start free, upgrade anytime',
  'No credit card required',
  'Cancel anytime',
];

const PricingTeaser = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />

          {/* Content */}
          <div className="relative z-10 p-12 md:p-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to transform your <span className="gradient-text">workflow</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join 10,000+ photographers who are saving hours every week with AI-powered organization
            </p>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-lg px-8 py-6 rounded-full hover:opacity-90 transition-opacity"
              >
                <Link to="/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-full"
              >
                <Link to="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingTeaser;
