import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Search } from 'lucide-react';
import { api } from '@/lib/api';

export default function ClientPortal() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.getEventByCode(accessCode.trim().toUpperCase());
      navigate(`/client/event/${accessCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[520px] h-[520px] bg-blue-600/20 rounded-full blur-[130px] opacity-50 mix-blend-screen" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 mb-2">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Camera className="w-4 h-4 text-purple-300" />
              </div>
              <span className="text-sm text-purple-100 tracking-wide">
                Client Access Portal
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-sky-300 to-blue-400">
              Enter your access code to unlock event memories
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-xl">
              Your photographer has given you a unique code. Use it here to instantly
              discover and download all photos where you appear from your special event.
            </p>
            <div className="flex flex-wrap gap-3 text-xs md:text-sm text-gray-400">
              <div className="px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/60">
                Secure one-time access
              </div>
              <div className="px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/60">
                No account required
              </div>
              <div className="px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/60">
                Powered by smart face matching
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400" />
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Search className="w-5 h-5 text-purple-400" />
                  Access Your Event
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the 8-character code shared by your photographer to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="accessCode" className="text-sm font-medium text-gray-200">
                      Access Code
                    </label>
                    <div className="relative">
                      <Input
                        id="accessCode"
                        type="text"
                        placeholder="ABC12345"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="text-center text-xl tracking-[0.4em] font-mono bg-gray-900/80 border-gray-700 text-white placeholder:text-gray-600 h-14"
                        required
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[11px] text-gray-500">
                        8 characters
                      </div>
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-400"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/30 h-12 text-base font-semibold rounded-xl"
                    size="lg"
                    disabled={loading || accessCode.length < 8}
                  >
                    {loading ? (
                      <>Checking access...</>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Access Event
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Make sure you enter the code exactly as provided by your photographer.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
