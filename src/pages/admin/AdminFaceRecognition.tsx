import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ScanFace, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminFaceRecognition() {
  const [status, setStatus] = useState<{ status: string; modelsLoaded: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detector, setDetector] = useState<'ssd' | 'tiny' | 'mtcnn'>('ssd');
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<{ faceCount: number; detections: any[] } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await api.getFaceRecognitionStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const data = await api.detectFaces(selectedFile, detector);
      setResult(data);
      toast({
        title: 'Detection Complete',
        description: `Successfully detected ${data.faceCount} face(s) using ${detector.toUpperCase()}.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Detection Failed',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">AI Face Recognition</h1>
          <p className="text-slate-400 mt-1">Test and monitor the facial recognition engine.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${status?.modelsLoaded ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
          {status?.modelsLoaded ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Models Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Models Not Loaded</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Engine Status */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Engine Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Status</span>
              <span className="text-sm font-medium text-emerald-400 uppercase">{status?.status || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Library</span>
              <span className="text-sm font-medium text-slate-200">face-api.js</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-400">Backend</span>
              <span className="text-sm font-medium text-indigo-400">TensorFlow.js</span>
            </div>
          </CardContent>
        </Card>

        {/* Test Area */}
        <Card className="md:col-span-2 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-emerald-400" />
              Live Test
            </CardTitle>
            <CardDescription>Upload an image to test face detection accuracy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-2xl hover:bg-slate-800/20 transition-colors group">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Test" className="max-h-64 rounded-lg shadow-2xl" />
                  {result && result.detections.map((det, i) => (
                    <div 
                      key={i}
                      className="absolute border-2 border-emerald-500 rounded pointer-events-none"
                      style={{
                        left: `${(det.box.x / det.imageWidth) * 100}%`,
                        top: `${(det.box.y / det.imageHeight) * 100}%`,
                        width: `${(det.box.width / det.imageWidth) * 100}%`,
                        height: `${(det.box.height / det.imageHeight) * 100}%`,
                      }}
                    />
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 h-6 w-6"
                    onClick={() => { setSelectedFile(null); setPreview(''); setResult(null); }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-400">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 10MB</p>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Engine</label>
                  <select 
                    value={detector} 
                    onChange={(e) => setDetector(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 outline-none transition-all hover:border-slate-600"
                  >
                    <option value="ssd">SSD Mobilenet (High Accuracy)</option>
                    <option value="mtcnn">MTCNN (Standard)</option>
                    <option value="tiny">Tiny Face (Fast)</option>
                  </select>
                </div>

                {result && (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mt-4">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{result.faceCount} Faces Detected</span>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleDetect} 
                disabled={!selectedFile || uploading}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-8 mt-4"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanFace className="w-4 h-4 mr-2" />
                    Run Detection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
