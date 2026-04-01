import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function GhibliStudio() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPreview = (location.state && (location.state as any).selfie) || '';
  const [sourcePreview, setSourcePreview] = useState<string>(initialPreview);
  const [apiKey, setApiKey] = useState('');
  const [converting, setConverting] = useState(false);
  const [resultPreview, setResultPreview] = useState<string>('');
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setSourcePreview(String(r.result || ''));
    r.readAsDataURL(f);
  };

  const convertToGhibli = async () => {
    setError('');
    if (!sourcePreview) {
      setError('Please upload a photo first.');
      return;
    }
    setConverting(true);

    try {
      // Try to upload the image data to a conversion API.
      // This uses a placeholder endpoint - replace with real API.
      const blob = await (await fetch(sourcePreview)).blob();
      const fd = new FormData();
      fd.append('image', blob, 'photo.jpg');

      const res = await fetch('https://api.example.com/convert-ghibli', {
        method: 'POST',
        headers: apiKey ? { 'x-api-key': apiKey } : undefined,
        body: fd,
      }).catch(() => null);

      if (res && res.ok) {
        // try get blob
        const ct = res.headers.get('content-type') || '';
        if (ct.startsWith('image/')) {
          const rb = await res.blob();
          const url = URL.createObjectURL(rb);
          setResultPreview(url);
        } else {
          const json = await res.json().catch(() => null);
          if (json && json.resultBase64) {
            setResultPreview(`data:image/jpeg;base64,${json.resultBase64}`);
          } else if (json && json.resultUrl) {
            setResultPreview(json.resultUrl);
          } else {
            setResultPreview(sourcePreview);
          }
        }
      } else {
        // fallback: just show the source as a placeholder result
        setResultPreview(sourcePreview);
      }
    } catch (err) {
      // fail gracefully
      setError('Conversion failed. (This demo uses a placeholder API)');
      setResultPreview(sourcePreview);
    } finally {
      setConverting(false);
    }
  };

  const downloadResult = async () => {
    if (!resultPreview) return;
    try {
      const resp = await fetch(resultPreview);
      const blob = await resp.blob();
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = 'ghibli-art.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-green-300">Ghibli Art Studio</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>

        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Convert your photo</CardTitle>
            <CardDescription className="text-gray-400">Upload a photo, enter an API key (optional), and convert to a Ghibli-style artwork.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-300">Your Photo</div>
                <div className="rounded-lg bg-black/20 border border-gray-800 p-4 flex items-center justify-center">
                  {sourcePreview ? (
                    // eslint-disable-next-line
                    <img src={sourcePreview} alt="source" className="max-h-64 rounded" />
                  ) : (
                    <div className="text-gray-500">No photo selected</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input type="file" accept="image/*" onChange={handleFile} />
                  <Input placeholder="API key (optional)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                </div>
                <div>
                  <Button onClick={convertToGhibli} disabled={converting || !sourcePreview}>
                    {converting ? 'Converting...' : 'Convert to Ghibli Art'}
                  </Button>
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-300">Ghibli Result</div>
                <div className="rounded-lg bg-black/20 border border-gray-800 p-4 flex items-center justify-center">
                  {resultPreview ? (
                    // eslint-disable-next-line
                    <img src={resultPreview} alt="result" className="max-h-64 rounded" />
                  ) : (
                    <div className="text-gray-500">Converted image will appear here</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadResult} disabled={!resultPreview}>Download Artwork</Button>
                  <Button variant="outline" onClick={() => { setResultPreview(''); setSourcePreview(''); setApiKey(''); }}>Reset</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
