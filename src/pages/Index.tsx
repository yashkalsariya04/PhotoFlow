import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Showcase from '@/components/landing/Showcase';
import Testimonials from '@/components/landing/Testimonials';
import PricingTeaser from '@/components/landing/PricingTeaser';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Showcase />
        <Testimonials />
        <PricingTeaser />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
