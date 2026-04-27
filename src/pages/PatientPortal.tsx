import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { HeartPulse, ArrowLeft, QrCode, Keyboard, ScanLine, Shield, Eye, EyeOff } from 'lucide-react';

export default function PatientPortal() {
  const [inputMethod, setInputMethod] = useState<'code' | 'qr'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/report/${accessCode.toUpperCase()}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#EBF1FF] flex flex-col">


      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-[#1E40AF]" />
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#1E40AF]">MediVoice</div>
                <div className="text-[10px] text-gray-500">Smart Digital Medicine</div>
              </div>
            </Link>
          </div>
          <span className="text-sm font-semibold text-[#1E40AF] bg-[#EBF1FF] px-4 py-1.5 rounded-full">
            Patient Portal
          </span>
        </div>
      </header>


      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#1E40AF] flex items-center justify-center mx-auto mb-5 shadow-md">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1E40AF] mb-2">View Your Report</h1>
            <p className="text-sm text-gray-500">Enter the access code provided by your doctor</p>
          </div>

          <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm">
            <button
              onClick={() => setInputMethod('code')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all ${
                inputMethod === 'code'
                  ? 'bg-[#1E40AF] text-white shadow'
                  : 'text-gray-500 hover:text-[#1E40AF]'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Enter Code
            </button>
            <button
              onClick={() => setInputMethod('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all ${
                inputMethod === 'qr'
                  ? 'bg-[#1E40AF] text-white shadow'
                  : 'text-gray-500 hover:text-[#1E40AF]'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              Scan QR
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            {inputMethod === 'code' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Access Code
                  </label>
                  <div className="relative">
                    <Input
                      type={showCode ? 'text' : 'password'}
                      placeholder="e.g. MV1A2B3C"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      className="rounded-xl border-gray-200 text-center text-lg tracking-widest font-mono uppercase pr-10 focus:border-[#1E40AF] focus:ring-[#1E40AF]"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E40AF]"
                    >
                      {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    The access code is provided by your doctor
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!accessCode.trim() || isLoading}
                  className="w-full py-3 rounded-full bg-[#1E40AF] text-white font-semibold hover:bg-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Querying...
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4" />
                      View Report
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-44 h-44 mx-auto mb-5 rounded-2xl border-2 border-dashed border-[#93C5FD] flex items-center justify-center bg-[#EBF1FF]">
                  <div className="text-center">
                    <ScanLine className="w-12 h-12 text-[#93C5FD] mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Camera Preview</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Position the QR code within the frame to scan
                </p>
                <button
                  onClick={() => navigate('/report/MV8X2K9P')}
                  className="px-6 py-2.5 rounded-full border-2 border-[#1E40AF] text-[#1E40AF] text-sm font-semibold hover:bg-[#EBF1FF] transition-colors"
                >
                  Simulate Scan
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 bg-white rounded-2xl p-5 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-0.5">Privacy & Security</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your reports are encrypted and only accessible to you and your doctor.
              </p>
            </div>
          </div>

        </div>
      </main>


      <footer className="bg-white border-t border-gray-100 py-4">
        <p className="text-center text-xs text-gray-400">
          © 2024 MediVoice AI · HIPAA Compliant · Privacy Protected
        </p>
      </footer>

    </div>
  );
}
