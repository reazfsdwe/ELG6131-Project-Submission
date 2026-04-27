import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Mic,
  Square,
  RotateCcw,
  FileText,
  Sparkles,
  ArrowLeft,
  User,
  CheckCircle,
  Stethoscope,
  Loader2,
  Bot,
  SendHorizontal,
  Edit2,
  AlertCircle,
  HeartPulse,
  LayoutDashboard,
} from 'lucide-react';
import { useReports, type BloodIndicator } from '../context/ReportContext';
import { generateSnowflakeCode } from '@/lib/snowflake';
import { processText } from '../services/llmService';
import { CdSpinner } from '../components/CdSpinner';

export default function DoctorPortal() {
  const { addReport } = useReports();
  const [activeTab, setActiveTab] = useState('imaging');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isInfoRecording, setIsInfoRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [, setAudioLevels] = useState<number[]>(Array(20).fill(10));
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  
  const [editableTranscript, setEditableTranscript] = useState('');
  
  const [patientInfo, setPatientInfo] = useState({
    name: '', id: '', phone: '', age: '', gender: '', bloodType: '',
    examDate: new Date().toISOString().split('T')[0],
    examType: 'Chest CT',
  });
  
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary?: string; keyPoints?: string[]; patientExplanation: string; recommendations?: string[];
  } | null>(null);

  const [bloodReport, setBloodReport] = useState<{
    uploaded: boolean; 
    fileName?: string; 
    indicators?: BloodIndicator[]; 
    summary?: string;
    aiExplanation?: string;
  }>({ uploaded: false });
  
  const [editableIndicators, setEditableIndicators] = useState<BloodIndicator[]>([]);
  const [isAnalyzingBlood, setIsAnalyzingBlood] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const infoRecognitionRef = useRef<SpeechRecognition | null>(null);
  const latestTranscriptRef = useRef(''); 
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);



  const triggerInfoParser = async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    setAiStatus('Extracting patient info...');
    
    try {
      const systemPrompt = `Extract patient information. You MUST respond with ONLY a JSON object in this exact format, nothing else: {"name": "", "age": "", "gender": "", "bloodType": "", "phone": "", "id": "", "examDate": ""}`;
      const result = await processText(text, systemPrompt, true);
      if (result.content) {
          const data = JSON.parse(result.content);
          setPatientInfo(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Info extract error:', e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmAnalysis = async () => {
    if (!editableTranscript.trim()) {
        alert('Please enter or record a clinical description first');
        return;
    }
    
    setIsThinking(true);
    setAiStatus('Generating in-depth medical analysis...');

    const systemPrompt = `Explain the following medical scan results to a patient as if they are a friend with no medical background. Use everyday language, avoid medical jargon, and be reassuring. You MUST respond with ONLY a JSON object: {"patientExplanation": "your explanation here"}`;

    try {
      const result = await processText(editableTranscript, systemPrompt, true);
      if (result.content) {
          const data = JSON.parse(result.content);
          setAiAnalysis(data);
      } else if (result.error) {
          throw new Error(result.error);
      }
    } catch (e) {
      console.error('Analysis Error:', e);
      alert(`Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsThinking(false);
    }
  };

  const [bloodText, setBloodText] = useState('');

  const handleBloodTextAnalysis = async () => {
    if (!bloodText.trim()) return;

    setIsThinking(true);
    setAiStatus('Analyzing blood report data...');

    const systemPrompt = `Extract blood test indicators from the text. You MUST respond with ONLY a JSON object in this exact format, nothing else: {"indicators": [{"name": "WBC", "value": "6.5", "unit": "x10^9/L", "range": "4.0-11.0", "status": "normal"}]}. Judge status by comparing value to range.`;

    try {
      const result = await processText(bloodText, systemPrompt, true);
      if (result.content) {
        const data = JSON.parse(result.content);
        setEditableIndicators(data.indicators || []);
        setBloodReport({ uploaded: true, indicators: [], aiExplanation: '' });
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error('Blood analysis error:', e);
      alert(`Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmBloodAnalysis = async () => {
    setIsAnalyzingBlood(true);
    setAiStatus('Interpreting verified data...');
    setIsThinking(true);

    const indicatorsStr = editableIndicators.map(i => `${i.name}: ${i.value} ${i.unit} (Ref: ${i.range}) [${i.status}]`).join('\n');
    const systemPrompt = `Explain these blood test results to a patient like you are their friendly family doctor. Use simple everyday words, no medical jargon. For any abnormal values, explain what it might mean in plain terms and suggest simple lifestyle tips. Keep it short, warm, and reassuring. Write 1-2 short paragraphs. Do not wrap your response in quotes.`;

    try {
      const result = await processText(indicatorsStr, systemPrompt);
      setBloodReport(prev => ({
          ...prev!,
          indicators: editableIndicators,
          aiExplanation: result.content || 'Analysis Failed'
      }));
    } catch (e) {
      console.error('Interpretation Error:', e);
      alert('Failed to generate interpretation. Please check connection or API key.');
    } finally {
      setIsThinking(false);
      setIsAnalyzingBlood(false);
    }
  };

  const updateIndicator = (index: number, field: keyof BloodIndicator, value: string) => {
    const newIndicators = [...editableIndicators];
    newIndicators[index] = { ...newIndicators[index], [field]: value } as BloodIndicator;
    setEditableIndicators(newIndicators);
  };

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
        setIsVoiceSupported(false);
        return;
    }

    if (!infoRecognitionRef.current) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            latestTranscriptRef.current = transcript;
        };
        infoRecognitionRef.current = recognition;
    }

    if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setEditableTranscript(prev => prev + finalTranscript);
            }
        };
        recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleInfoRecording = () => {
    if (!isVoiceSupported) { alert('Speech recognition is not supported in this browser.'); return; }
    if (isInfoRecording) {
        infoRecognitionRef.current?.stop();
        setIsInfoRecording(false);
        triggerInfoParser(latestTranscriptRef.current);
    } else {
        latestTranscriptRef.current = '';
        setIsInfoRecording(true);
        try {
            infoRecognitionRef.current?.start();
        } catch (e) {
            console.error('Recognition Start Error:', e);
            setIsInfoRecording(false);
        }
    }
  };

  const handleToggleDoctorRecording = () => {
    if (!isVoiceSupported) { alert('Speech recognition is not supported in this browser.'); return; }
    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
        setIsRecording(true);
        try {
            recognitionRef.current?.start();
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
                setAudioLevels(Array(20).fill(0).map(() => Math.random() * 60 + 10));
            }, 1000);
        } catch (e) {
            console.error('Recognition Start Error:', e);
            setIsRecording(false);
        }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleGenerateCode = () => {
    if (!patientInfo.name) { alert('Please enter patient name'); return; }
    
    if (!aiAnalysis && !bloodReport.uploaded) {
        alert('Please provide imaging findings or upload a blood report first.');
        return;
    }

    setIsGeneratingCode(true);
    setTimeout(() => {
      try {
        const code = generateSnowflakeCode().toUpperCase();
        setGeneratedCode(code);
        setIsGeneratingCode(false);
        addReport({
          id: code, patient: { ...patientInfo }, 
          transcripts: [{ id: 1, timestamp: '00:00', text: editableTranscript, speaker: 'doctor' }],
          aiAnalysis: aiAnalysis || { summary: '', keyPoints: [], patientExplanation: 'Not provided', recommendations: [] },
          bloodReport: bloodReport.uploaded ? { ...bloodReport, indicators: editableIndicators } : null,
          status: 'completed', createdAt: Date.now()
        });
      } catch (e) {
        console.error('Generation Error:', e);
        alert('Failed to generate report. Please try again.');
        setIsGeneratingCode(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#EBF1FF] relative">


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
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#1E40AF] bg-[#EBF1FF] px-4 py-1.5 rounded-full">
              Doctor Portal
            </span>
            <Link to="/doctor/dashboard">
              <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1E40AF] text-white text-sm font-semibold hover:bg-[#1e3a8a] transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Manage Reports
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#1E40AF]">Doctor Station</h1>
          <p className="text-gray-500 text-sm mt-1">Voice Input + Manual Review + AI Analysis</p>
        </div>

        {!isVoiceSupported && (
            <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-black shadow-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Voice recognition is not supported in this browser. You can still type findings manually.</p>
            </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white rounded-full p-1 shadow-sm flex w-fit gap-1">
            <TabsTrigger
              value="imaging"
              className="data-[state=active]:bg-[#1E40AF] data-[state=active]:text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-all text-gray-500"
            >
              Imaging Description
            </TabsTrigger>
            <TabsTrigger
              value="blood"
              className="data-[state=active]:bg-[#1E40AF] data-[state=active]:text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-all text-gray-500"
            >
              Blood Report
            </TabsTrigger>
          </TabsList>

          <Card className="bg-white rounded-2xl shadow-sm border-0 relative overflow-hidden">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                <User className="w-4 h-4" />Patient Information
              </CardTitle>
              <div className="flex items-center gap-2">
                {isInfoRecording && <Loader2 className="w-4 h-4 animate-spin text-[#1E40AF]" />}
                <button
                  onClick={handleToggleInfoRecording}
                  disabled={isThinking}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    isInfoRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-[#1E40AF] text-[#1E40AF] hover:bg-[#EBF1FF]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {isInfoRecording ? 'Done, Parsing...' : 'Voice Fill'}
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-3 gap-4">
              {[
                { label: 'Name', key: 'name' },
                { label: 'Age', key: 'age' },
                { label: 'Gender', key: 'gender' },
                { label: 'Blood Type', key: 'bloodType' },
                { label: 'Phone', key: 'phone' },
                { label: 'ID', key: 'id' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</Label>
                  <Input
                    value={patientInfo[key as keyof typeof patientInfo]}
                    onChange={e => setPatientInfo({ ...patientInfo, [key]: e.target.value })}
                    className="rounded-lg border-gray-200 focus:border-[#1E40AF] focus:ring-[#1E40AF] h-9 text-sm"
                  />
                </div>
              ))}
            </CardContent>

            {isThinking && aiStatus.includes('extracting') && (
              <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF] mb-3" />
                <p className="text-[#1E40AF] font-semibold text-sm">{aiStatus}</p>
              </div>
            )}
          </Card>

          <TabsContent value="imaging" className="space-y-6 outline-none">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                    <Mic className="w-4 h-4" />Recording Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <div className="w-full h-40 flex items-center justify-center mb-4">
                    <CdSpinner isRecording={isRecording} className="w-28 h-28" />
                  </div>
                  <div className="text-3xl font-bold mb-3 text-[#1E40AF]">{formatTime(recordingTime)}</div>
                  <p className="text-sm text-gray-400">
                    {isVoiceSupported ? 'Click the button below to start describing findings' : 'Please type description manually below'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl shadow-sm border-0 flex flex-col relative overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                    <FileText className="w-4 h-4" />Findings Description
                  </CardTitle>
                  <button onClick={() => setEditableTranscript('')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />Reset
                  </button>
                </CardHeader>
                <CardContent className="p-4 flex-1 min-h-[250px]">
                  <Textarea
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    placeholder="Text will appear here in real-time or type manually..."
                    className="w-full h-full min-h-[200px] text-sm leading-relaxed resize-none border-gray-200 rounded-lg focus:border-[#1E40AF] focus:ring-[#1E40AF]"
                  />
                </CardContent>
                {isThinking && (aiStatus.includes('generating') || aiStatus.includes('extracting')) && (
                  <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF] mb-3" />
                    <p className="text-[#1E40AF] font-semibold text-sm">{aiStatus}</p>
                  </div>
                )}
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleToggleDoctorRecording}
                disabled={isThinking || !isVoiceSupported}
                className={`flex-1 py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#1E40AF] text-white hover:bg-[#1e3a8a]'
                } disabled:opacity-50`}
              >
                {isRecording ? <><Square className="w-4 h-4" />Stop Recording</> : <><Mic className="w-4 h-4" />Start Case Description</>}
              </button>
              <button
                onClick={handleConfirmAnalysis}
                disabled={!editableTranscript.trim() || isRecording || isThinking}
                className="flex-1 py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 bg-[#1E40AF] text-white hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />Confirm and Start AI Analysis
              </button>
            </div>

            <Card className={`bg-white rounded-2xl shadow-sm border-0 ${aiAnalysis ? '' : 'opacity-60'}`}>
              <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />AI Analysis Preview
                </CardTitle>
                {aiAnalysis && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />Complete
                  </span>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {aiAnalysis ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#EBF1FF] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-[#1E40AF]" />
                      </div>
                      <p className="text-sm text-gray-600 bg-[#EBF1FF] p-4 rounded-xl leading-relaxed">{aiAnalysis.patientExplanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-[#EBF1FF] flex items-center justify-center mb-3">
                      <Sparkles className="w-7 h-7 text-[#93C5FD]" />
                    </div>
                    <p className="text-sm text-gray-400 max-w-xs">Please review description, then click "Confirm and Start AI Analysis"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blood" className="space-y-6 outline-none">
            {!bloodReport.uploaded ? (
              <Card className="bg-white rounded-2xl shadow-sm border-0 relative overflow-hidden">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                    <FileText className="w-4 h-4" />Blood Report Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Textarea
                    placeholder="Paste or type the blood test results here, e.g.&#10;WBC: 6.5 x10^9/L (4.0-11.0)&#10;RBC: 4.8 x10^12/L (4.0-5.5)&#10;Hemoglobin: 145 g/L (120-160)"
                    value={bloodText}
                    onChange={(e) => setBloodText(e.target.value)}
                    className="min-h-[200px] border-gray-200 rounded-xl text-sm resize-none"
                  />
                  <button
                    onClick={handleBloodTextAnalysis}
                    disabled={!bloodText.trim() || isThinking}
                    className="w-full py-3.5 rounded-full bg-[#1E40AF] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
                  >
                    {isThinking && aiStatus.includes('Analyzing blood') ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Extract & Analyze</>
                    )}
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5">
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-[#1E40AF] flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />Data Review & Edit
                    </CardTitle>
                    <button onClick={() => { setBloodReport({ uploaded: false }); setBloodText(''); }} className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors">
                      Re-enter
                    </button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs font-semibold text-gray-500">Test Name</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Result</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Unit</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Reference Range</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editableIndicators.map((indicator, index) => (
                          <TableRow key={index}>
                            <TableCell><Input value={indicator.name} onChange={(e) => updateIndicator(index, 'name', e.target.value)} className="h-8 border-gray-100 text-sm rounded-lg" /></TableCell>
                            <TableCell><Input value={indicator.value} onChange={(e) => updateIndicator(index, 'value', e.target.value)} className="h-8 font-bold text-[#1E40AF] border-gray-100 text-sm rounded-lg" /></TableCell>
                            <TableCell><Input value={indicator.unit} onChange={(e) => updateIndicator(index, 'unit', e.target.value)} className="h-8 text-gray-500 border-gray-100 text-sm rounded-lg" /></TableCell>
                            <TableCell><Input value={indicator.range} onChange={(e) => updateIndicator(index, 'range', e.target.value)} className="h-8 text-gray-500 border-gray-100 text-sm rounded-lg" /></TableCell>
                            <TableCell>
                              <select
                                value={indicator.status}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                onChange={(e) => updateIndicator(index, 'status', e.target.value as any)}
                                className="h-8 rounded-lg border border-gray-200 text-sm px-2 bg-white text-gray-700"
                              >
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="low">Low</option>
                              </select>
                            </TableCell>
                          </TableRow>
                        ))}
                        {editableIndicators.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-gray-400">No data recognized. Please add manually or re-upload.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {bloodReport.aiExplanation && (
                  <Card className="bg-white rounded-2xl shadow-sm border-0 animate-in fade-in slide-in-from-bottom-4">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-bold text-[#1E40AF] flex items-center gap-2 mb-3">
                        <Bot className="w-4 h-4" />AI In-depth Interpretation
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed bg-[#EBF1FF] p-4 rounded-xl">
                        {bloodReport.aiExplanation}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <button
                  onClick={handleConfirmBloodAnalysis}
                  disabled={editableIndicators.length === 0 || isThinking}
                  className="w-full py-3.5 rounded-full bg-[#1E40AF] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
                >
                  {isThinking && isAnalyzingBlood ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Generating interpretation...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Data Verified, Generate AI Interpretation</>
                  )}
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-10 border-t border-gray-200 pt-8 pb-16 flex justify-center">
          {!generatedCode ? (
            <button
              onClick={handleGenerateCode}
              disabled={isGeneratingCode || !patientInfo.name || (!aiAnalysis && !bloodReport.uploaded)}
              className="px-12 py-4 rounded-full bg-[#1E40AF] text-white font-bold text-base flex items-center gap-2 hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors shadow-md"
            >
              {isGeneratingCode ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Generating Report...</>
              ) : (
                <><SendHorizontal className="w-5 h-5" />Generate Patient Access Report</>
              )}
            </button>
          ) : (
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-10 text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Report Generated</h2>
              <p className="text-sm text-gray-400 mb-7">Share the access code below with your patient</p>
              <div className="bg-[#EBF1FF] px-8 py-5 rounded-xl mb-7 inline-block">
                <span className="text-xs text-gray-400 block mb-1 uppercase tracking-widest">Access Code</span>
                <div className="text-4xl font-black tracking-widest text-[#1E40AF]">{generatedCode}</div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link to={`/report/${generatedCode}`} className="flex-1">
                  <button className="w-full py-2.5 rounded-full border-2 border-[#1E40AF] text-[#1E40AF] font-semibold text-sm hover:bg-[#EBF1FF] transition-colors">
                    Preview Report
                  </button>
                </Link>
                <button onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-full bg-[#1E40AF] text-white font-semibold text-sm hover:bg-[#1e3a8a] transition-colors">
                  New Case
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
