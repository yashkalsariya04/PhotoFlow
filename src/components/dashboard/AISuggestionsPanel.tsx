import { motion } from 'framer-motion';
import { Sparkles, FolderPlus, Merge, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiSuggestions } from '@/data/mockData';

const iconMap = {
  album: FolderPlus,
  tag: Sparkles,
  merge: Merge,
};

const AISuggestionsPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl glass"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-semibold">AI Suggestions</h3>
      </div>

      <div className="space-y-4">
        {aiSuggestions.map((suggestion, index) => {
          const Icon = iconMap[suggestion.type as keyof typeof iconMap];
          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium mb-1">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{suggestion.photoCount} photos</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {suggestion.confidence}% confident
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground">
        View all suggestions
      </Button>
    </motion.div>
  );
};

export default AISuggestionsPanel;
