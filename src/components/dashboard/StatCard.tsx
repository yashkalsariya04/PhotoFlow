import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

const StatCard = ({ icon: Icon, label, value, change, className }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-6 rounded-2xl glass hover-lift', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {change && (
          <span
            className={cn(
              'text-sm font-medium px-2 py-1 rounded-full',
              change.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {change.positive ? '+' : ''}{change.value}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
};

export default StatCard;
