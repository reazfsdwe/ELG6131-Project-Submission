import { useState, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useReports, type BloodIndicator } from '../context/ReportContext';
import { processText } from '../services/llmService';

import {
  ArrowLeft, User, Calendar, FileText, Printer, Download, Share2,
  CheckCircle, TrendingUp, TrendingDown, Minus, Sparkles,
  ChevronRight, Home, Bot, Info, HeartPulse, Loader2,
} from 'lucide-react';

export default function ReportView() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const isFromDoctor = searchParams.get('from') === 'doctor';
  const { getReport, isDbReady } = useReports();
  const [activeTab, setActiveTab] = useState('summary');
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedIndicator, setSelectedIndicator] = useState<BloodIndicator | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [indicatorExplanation, setIndicatorExplanation] = useState<string | null>(null);

  const realReport = getReport(code || '');

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EBF1FF]">
        <p className="text-[#1E40AF] text-sm animate-pulse font-semibold">Loading report...</p>
      </div>
    );
  }

  if (realReport?.isHidden) {
    return (
      <div className="min-h-screen bg-[#EBF1FF] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-gray-800 mb-2">Report Not Available</h1>
          <p className="text-sm text-gray-400 mb-6">This report has been hidden by your doctor.</p>
          <Link to="/patient">
            <button className="px-6 py-2.5 rounded-full bg-[#1E40AF] text-white font-semibold text-sm hover:bg-[#1e3a8a] transition-colors">
              Go to Patient Portal
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const mockReport = {
    patient: { name: 'John Doe', id: 'P2024001', age: '45', gender: 'Male' },
    exam: { type: 'Chest CT Scan', date: '2024-01-15' },
    imagingDescription: 'Chest CT scan shows a nodule of approximately 2.3 cm in the upper lobe of the right lung, with irregular margins, lobulated, and visible short spicules.',
    simplifiedExplanation: 'Your CT scan shows an abnormal shadow of about 2.3 cm in the upper part of your right lung. The edges are irregular, which warrants further clinical follow-up.',
    keyPoints: ['A nodule of approx. 2.3 cm found in the right lung', 'Irregular edges noted', 'Further tests recommended'],
    recommendations: ['Consult specialist promptly', 'Maintain regular follow-up'],
    bloodIndicators: [] as BloodIndicator[],
    bloodExplanation: '',
  };

  const displayData = realReport ? {
    patient: { name: realReport.patient.name, id: realReport.patient.id, age: realReport.patient.age || '-', gender: realReport.patient.gender || '-' },
    exam: { type: realReport.patient.examType, date: realReport.patient.examDate },
    imagingDescription: (Array.isArray(realReport.transcripts) ? realReport.transcripts : []).map(t => t.text).join('\n'),
    simplifiedExplanation: realReport.aiAnalysis?.patientExplanation || 'No explanation available',
    keyPoints: realReport.aiAnalysis?.keyPoints || [],
    recommendations: realReport.aiAnalysis?.recommendations || [],
    bloodIndicators: realReport.bloodReport?.indicators || [],
    bloodExplanation: realReport.bloodReport?.aiExplanation || '',
  } : mockReport;

  const handleIndicatorClick = (indicator: BloodIndicator) => {
    setSelectedIndicator(indicator);
    setIsAiLoading(false);
    setIndicatorExplanation(null);
  };

  const handleAskAI = async () => {
    if (!selectedIndicator) return;
    setIsAiLoading(true);
    setIndicatorExplanation(null);
    const systemPrompt = `Explain this blood test result to a patient like a friendly family doctor. Use simple everyday words, no medical jargon. Indicator: ${selectedIndicator.name}, Value: ${selectedIndicator.value} ${selectedIndicator.unit}, Normal range: ${selectedIndicator.range}, Status: ${selectedIndicator.status}. Tell them what this means in plain terms, whether they should worry, and one simple tip. Keep to 2-3 short sentences. Do not wrap your response in quotes.`;
    try {
      const result = await processText(selectedIndicator.name, systemPrompt);
      setIndicatorExplanation(result.content || 'Failed to generate explanation.');
    } catch {
      setIndicatorExplanation("Sorry, I couldn't get an explanation right now. Please consult your doctor.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const el = printRef.current;
    el.style.display = 'block';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const w = pdf.internal.pageSize.getWidth();
      const imgW = w - 30;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 15, 15, imgW, imgH);
      pdf.save(`MediVoice_Report_${code}.pdf`);
    } finally {
      el.style.display = 'none';
    }
  };

  const statusColor = (s: string) =>
    s === 'normal' ? 'text-green-600' : s === 'high' ? 'text-amber-500' : 'text-[#1E40AF]';

  const statusBg = (s: string) =>
    s === 'normal' ? 'bg-green-50 border-green-200' : s === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-[#EBF1FF] border-[#93C5FD]';

  const statusLabel = (s: string) =>
    s === 'normal'
      ? <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">Normal</span>
      : s === 'high'
      ? <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">High</span>
      : <span className="text-xs font-semibold bg-blue-100 text-[#1E40AF] px-2.5 py-0.5 rounded-full">Low</span>;

  const statusIcon = (s: string) =>
    s === 'normal' ? <CheckCircle className="w-4 h-4 text-green-500" />
    : s === 'high' ? <TrendingUp className="w-4 h-4 text-amber-500" />
    : s === 'low' ? <TrendingDown className="w-4 h-4 text-[#1E40AF]" />
    : <Minus className="w-4 h-4 text-gray-400" />;

  return (
    <div className="min-h-screen bg-[#EBF1FF] flex flex-col">

      <Dialog open={!!selectedIndicator} onOpenChange={(open) => !open && setSelectedIndicator(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-0 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
              {selectedIndicator?.name}
              {selectedIndicator && statusLabel(selectedIndicator.status)}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">Indicator Health Breakdown</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-[#EBF1FF] rounded-xl p-4 flex items-center justify-around">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Your Value</p>
                <p className={`text-2xl font-black ${statusColor(selectedIndicator?.status || '')}`}>
                  {selectedIndicator?.value} <span className="text-sm font-normal text-gray-400">{selectedIndicator?.unit}</span>
                </p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Reference</p>
                <p className="text-sm font-semibold text-gray-600">{selectedIndicator?.range}</p>
              </div>
            </div>

            {!indicatorExplanation && !isAiLoading && (
              <button onClick={handleAskAI} className="w-full py-2.5 rounded-full bg-[#1E40AF] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e3a8a] transition-colors">
                <Sparkles className="w-4 h-4" />Ask AI
              </button>
            )}

            {isAiLoading && (
              <div className="flex flex-col items-center py-4 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#1E40AF]" />
                <p className="text-xs text-gray-400 animate-pulse">Generating health insights...</p>
              </div>
            )}

            {indicatorExplanation && (
              <div className="bg-[#EBF1FF] rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-wide mb-1">AI Explanation</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{indicatorExplanation}</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setSelectedIndicator(null)} className="w-full py-2.5 rounded-full bg-[#1E40AF] text-white text-sm font-semibold hover:bg-[#1e3a8a] transition-colors">
            Got it
          </button>
        </DialogContent>
      </Dialog>

      <div ref={printRef} style={{ display: 'none', width: '210mm', padding: '20px', background: 'white' }}>
        <h1 className="text-2xl font-bold text-center mb-8">MediVoice Medical Report: {code}</h1>
        <p><strong>Patient:</strong> {displayData.patient.name}</p>
        <p><strong>Diagnosis:</strong> {displayData.simplifiedExplanation}</p>
      </div>


      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={isFromDoctor ? '/doctor/dashboard' : '/patient'} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
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
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors">
              <Printer className="w-3.5 h-3.5" />Print
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E40AF] text-white text-sm font-semibold hover:bg-[#1e3a8a] transition-colors">
              <Download className="w-3.5 h-3.5" />PDF
            </button>
          </div>
        </div>
      </header>


      <main className="max-w-5xl mx-auto px-6 py-8 flex-1">

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EBF1FF] flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-[#1E40AF]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800">{displayData.patient.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                ID: {displayData.patient.id} · Age: {displayData.patient.age} · {displayData.patient.gender}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />Verified Report
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />{displayData.exam.date}
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white rounded-full p-1 shadow-sm flex w-fit gap-1">
            {[
              { value: 'summary', icon: Sparkles, label: 'Summary' },
              { value: 'imaging', icon: FileText, label: 'Imaging' },
              { value: 'blood', icon: TrendingUp, label: 'Blood' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-[#1E40AF] data-[state=active]:text-white rounded-full px-5 py-2 text-sm font-semibold transition-all text-gray-500 flex items-center gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary" className="space-y-4 outline-none">
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />AI Smart Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#EBF1FF] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-[#1E40AF]" />
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm">{displayData.simplifiedExplanation}</p>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="imaging" className="outline-none">
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                  <FileText className="w-4 h-4" />Imaging Examination Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Clinical Description</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{displayData.imagingDescription}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-widest mb-2">Patient-Friendly Insight</p>
                  <div className="bg-[#EBF1FF] rounded-xl p-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{displayData.simplifiedExplanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blood" className="outline-none">
            {displayData.bloodIndicators.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                    <Bot className="w-4 h-4" />Lab Results
                  </h3>
                  <span className="text-xs text-gray-400">Click a card for AI explanation</span>
                </div>

                {displayData.bloodExplanation && (
                  <Card className="bg-white rounded-2xl shadow-sm border-0">
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-600 leading-relaxed">{displayData.bloodExplanation}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {displayData.bloodIndicators.map((indicator, i) => (
                    <div
                      key={i}
                      onClick={() => handleIndicatorClick(indicator)}
                      className={`bg-white rounded-2xl border cursor-pointer hover:shadow-md transition-all p-5 ${statusBg(indicator.status)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{indicator.name}</h4>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                            Ref: {indicator.range} {indicator.unit}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {statusIcon(indicator.status)}
                          <Info className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className={`text-3xl font-black ${statusColor(indicator.status)}`}>{indicator.value}</span>
                        <span className="text-sm text-gray-400">{indicator.unit}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        {statusLabel(indicator.status)}
                        <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center py-16">
                <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No blood test data recorded</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap justify-center gap-3 mt-10 pb-10">
          {isFromDoctor ? (
            <Link to="/doctor/dashboard">
              <button className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#1E40AF] text-white font-semibold text-sm hover:bg-[#1e3a8a] transition-colors">
                <ArrowLeft className="w-4 h-4" />Back to Dashboard
              </button>
            </Link>
          ) : (
            <>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#1E40AF] text-[#1E40AF] font-semibold text-sm hover:bg-[#EBF1FF] transition-colors">
                <Share2 className="w-4 h-4" />Share with Family
              </button>
              <Link to="/">
                <button className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#1E40AF] text-white font-semibold text-sm hover:bg-[#1e3a8a] transition-colors">
                  <Home className="w-4 h-4" />Home
                </button>
              </Link>
            </>
          )}
        </div>
      </main>


      <footer className="bg-white border-t border-gray-100 py-5">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-gray-400">
          © 2024 MediVoice AI · All clinical decisions must be verified by certified professionals.
        </div>
      </footer>
    </div>
  );
}
