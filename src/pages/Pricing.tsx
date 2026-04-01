import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { pricingPlans } from '@/data/mockData';

const Pricing = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showAuthButtons={false} />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent <span className="gradient-text">pricing</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Choose the plan that works for you</p>
            <div className="flex items-center justify-center gap-4">
              <span className={yearly ? 'text-muted-foreground' : ''}>Monthly</span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={!yearly ? 'text-muted-foreground' : ''}>Yearly <span className="text-primary text-sm">(Save 20%)</span></span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`rounded-2xl p-8 ${plan.popular ? 'glass gradient-border ring-2 ring-primary' : 'glass'}`}>
                {plan.popular && (
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${yearly ? plan.yearlyPrice : plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Button className={`w-full mb-8 ${plan.popular ? 'gradient-primary' : ''}`} variant={plan.popular ? 'default' : 'outline'}>{plan.cta}</Button>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />{feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
