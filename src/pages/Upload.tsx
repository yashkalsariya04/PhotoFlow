import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, FileImage, Check, Sparkles, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  metadata?: {
    camera?: string;
    lens?: string;
    date?: string;
    location?: string;
  };
}

const UploadPage = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiTagging, setAiTagging] = useState(true);
  const [smartAlbums, setSmartAlbums] = useState(true);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/')
    );

    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
      metadata: {
        camera: ['Sony A7R IV', 'Canon EOS R5', 'Nikon Z9', 'Fujifilm GFX 100S'][Math.floor(Math.random() * 4)],
        lens: ['24-70mm f/2.8', '85mm f/1.4', '50mm f/1.2', '70-200mm f/2.8'][Math.floor(Math.random() * 4)],
        date: new Date().toISOString().split('T')[0],
        location: ['New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL'][Math.floor(Math.random() * 4)],
      },
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);

    // Simulate upload progress
    uploadFiles.forEach((uploadFile) => {
      simulateUpload(uploadFile.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'uploading' } : f))
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: 'complete' } : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
        );
      }
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const completedCount = files.filter((f) => f.status === 'complete').length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Photos</h1>
          <p className="text-muted-foreground">
            Drag and drop your photos or click to browse. We support RAW, JPEG, PNG, and more.
          </p>
        </div>

        {/* Drop Zone */}
        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          animate={{
            scale: isDragOver ? 1.02 : 1,
            borderColor: isDragOver ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          }}
          className="relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors hover:border-primary/50"
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xl font-semibold mb-2">
                {isDragOver ? 'Drop your photos here' : 'Drag & drop your photos'}
              </p>
              <p className="text-muted-foreground">or click to browse from your computer</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileImage className="w-4 h-4" />
                RAW
              </span>
              <span className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                JPEG
              </span>
              <span className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                PNG
              </span>
            </div>
          </div>
        </motion.div>

        {/* AI Options */}
        <div className="flex flex-wrap gap-6 p-6 rounded-2xl glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label htmlFor="ai-tagging" className="font-medium cursor-pointer">
                AI Auto-Tagging
              </Label>
              <p className="text-sm text-muted-foreground">Automatically tag your photos</p>
            </div>
            <Switch
              id="ai-tagging"
              checked={aiTagging}
              onCheckedChange={setAiTagging}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label htmlFor="smart-albums" className="font-medium cursor-pointer">
                Smart Albums
              </Label>
              <p className="text-sm text-muted-foreground">Organize into AI-created albums</p>
            </div>
            <Switch
              id="smart-albums"
              checked={smartAlbums}
              onCheckedChange={setSmartAlbums}
            />
          </div>
        </div>

        {/* Upload Progress */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Uploading {files.length} {files.length === 1 ? 'photo' : 'photos'}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {completedCount} of {files.length} complete
                </span>
              </div>

              {/* File List */}
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4 p-4 rounded-xl glass"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {file.metadata?.camera && <span>{file.metadata.camera}</span>}
                        {file.metadata?.lens && <span>• {file.metadata.lens}</span>}
                      </div>
                      
                      {/* Progress */}
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {file.status === 'complete' ? (
                        <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-4 h-4 text-success-foreground" />
                        </div>
                      ) : file.status === 'uploading' ? (
                        <span className="text-sm text-primary">{Math.round(file.progress)}%</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              {completedCount === files.length && files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center gap-4 pt-4"
                >
                  <Button variant="outline" onClick={() => setFiles([])}>
                    Upload More
                  </Button>
                  <Button className="gradient-primary">
                    View in Library
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
