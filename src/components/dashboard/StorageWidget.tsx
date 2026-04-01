import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { dashboardStats } from '@/data/mockData';
import { api } from '@/lib/api';

const StorageWidget = () => {
  const [usedBytes, setUsedBytes] = useState(0);
  const [storageTotalGb, setStorageTotalGb] = useState(10);
  const usedGb = usedBytes / (1024 * 1024 * 1024);
  const usedMb = usedBytes / (1024 * 1024);
  const usagePercent = (usedGb / storageTotalGb) * 100;

  const displayValue =
    usedMb < 1024 ? parseFloat(usedMb.toFixed(2)) : parseFloat((usedMb / 1024).toFixed(2));
  const displayUnit = usedMb < 1024 ? 'MB' : 'GB';

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await api.getStorageUsage();
        const bytes = data?.totalBytes ?? 0;
        setUsedBytes(Number.isFinite(bytes) ? bytes : 0);
      } catch (e) {
        setUsedBytes(0);
      }
    };

    fetchUsage();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl glass"
    >
      <h3 className="text-lg font-semibold mb-4">Storage</h3>
      
      {/* Progress Bar */}
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usagePercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 gradient-primary rounded-full"
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold">
            {displayValue} {displayUnit}
          </p>
          <p className="text-sm text-muted-foreground">of {storageTotalGb} GB used</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-primary">{usagePercent.toFixed(0)}%</p>
          <p className="text-sm text-muted-foreground">used</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StorageWidget;
