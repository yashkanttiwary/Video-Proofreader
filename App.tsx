import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, AppStep, ProcessedVideoData } from './types';
import { runGeminiAnalysis, uploadFileToGemini } from './services/geminiService';
import { AnalysisProgress } from './components/AnalysisProgress';
import { IssueCard, MarketingPanel } from './components/DashboardComponents';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { VideoWorkspace, VideoWorkspaceRef } from './components/VideoWorkspace';
import { LoginPage } from './components/LoginPage';
import { 
  UploadCloud, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  RefreshCcw,
  Settings,
  ShieldCheck,
  Youtube,
  AlertTriangle,
  CheckCircle2,
  X,
  LogOut,
  User,
  Link as LinkIcon
} from 'lucide-react';

// --- Header ---
const Header = ({ userName, onLogout, onOpenSettings }: { userName: string, onLogout: () => void, onOpenSettings: () => void }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-pw-blue text-white font-bold">PW</div>
          <span className="font-heading text-lg font-bold text-pw-blue">ProofVision</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onOpenSettings}
            className="text-gray-500 hover:text-pw-orange transition-colors" 
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden ring-2 ring-transparent hover:ring-pw-orange transition-all">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF6B35&color=fff`} 
                  alt="Profile" 
                />
              </div>
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100">
                   <p className="text-xs text-gray-500">Signed in as</p>
                   <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                </div>
                <button
                  onClick={onOpenSettings}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </button>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Upload Step ---
const UploadStep = ({ onUpload }: { onUpload: (file: File, platform: string, title?: string, channelUrl?: string) => void }) => {
  const [dragActive, setDragActive] = useState(false);
  const [platform, setPlatform] = useState('YouTube');
  const [title, setTitle] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved channel URL on mount or when platform changes
  useEffect(() => {
    const isInsta = platform.includes('Instagram');
    const key = isInsta ? 'pw_default_instagram_url' : 'pw_default_youtube_url';
    const savedUrl = localStorage.getItem(key);
    if (savedUrl) setChannelUrl(savedUrl);
  }, [platform]);

  // Save channel URL to local storage when changed
  const handleUrlChange = (val: string) => {
    setChannelUrl(val);
    const isInsta = platform.includes('Instagram');
    const key = isInsta ? 'pw_default_instagram_url' : 'pw_default_youtube_url';
    localStorage.setItem(key, val);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      onUpload(file, platform, title || autoTitle, channelUrl);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      onUpload(file, platform, title || autoTitle, channelUrl);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="mb-4 font-heading text-3xl font-bold text-pw-blue sm:text-4xl">
          Frame-perfect video QA for educators
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Upload your video. We'll catch spelling errors, fact-check physics, and optimize for algorithms.
        </p>
      </div>

      <div 
        className={`relative flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all
          ${dragActive ? 'border-pw-orange bg-orange-50' : 'border-gray-300 bg-white hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleChange}
        />
        
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-pw-orange">
            <UploadCloud size={32} />
          </div>
          <p className="mb-2 text-lg font-medium text-gray-900">
            Drag & drop your video here
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Supports large files (2GB+) via File API
          </p>
          <button 
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-pw-blue px-8 py-3 font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-800"
          >
            Browse Files
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        
        {/* Platform Selection */}
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
           <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">Target Platform</label>
           <div className="relative">
             <select 
               value={platform}
               onChange={(e) => setPlatform(e.target.value)}
               className="w-full appearance-none rounded-md border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-700 focus:border-pw-orange focus:outline-none"
             >
               <option>YouTube</option>
               <option>YouTube Shorts</option>
               <option>Instagram Reels</option>
             </select>
             <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
           </div>
        </div>

        {/* Channel Link Input */}
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
           <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
             {platform.includes('Instagram') ? 'Instagram Profile URL' : 'YouTube Channel URL'}
           </label>
           <div className="relative">
              <input 
                type="url"
                value={channelUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={platform.includes('Instagram') ? "https://instagram.com/..." : "https://youtube.com/@..."}
                className="w-full rounded-md border border-gray-200 bg-gray-50 pl-8 p-2.5 text-sm font-medium text-gray-700 focus:border-pw-orange focus:outline-none transition-colors"
              />
              <div className="absolute left-2.5 top-2.5 text-gray-400">
                <LinkIcon size={16} />
              </div>
           </div>
        </div>

        {/* Video Title */}
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100 sm:col-span-2">
           <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">Video Title (Optional)</label>
           <input 
             type="text"
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             placeholder="e.g. Newton's Laws Lecture 05"
             className="w-full rounded-md border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-700 focus:border-pw-orange focus:outline-none"
           />
        </div>
      </div>
    </div>
  );
};

// --- Helper to parse MM:SS to seconds ---
const parseTimestamp = (timeStr: string): number => {
  try {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  } catch (e) {
    return 0;
  }
};

const FitItem = ({ label, pass, value }: { label: string; pass: boolean; value: string }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      {pass ? (
        <CheckCircle2 size={14} className="text-green-600" />
      ) : (
        <X size={14} className="text-red-500" />
      )}
    </div>
    <p className={`text-sm font-bold ${pass ? 'text-gray-900' : 'text-red-600'}`}>
      {value}
    </p>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [step, setStep] = useState<AppStep>('login');
  
  // Auth State
  const [apiKey, setApiKey] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // App State
  const [file, setFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [channelUrl, setChannelUrl] = useState(''); // New State
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // New State
  const [activeTab, setActiveTab] = useState<'issues' | 'marketing'>('issues');
  const [error, setError] = useState<string | null>(null);
  
  // Analysis State
  const [processedVideo, setProcessedVideo] = useState<ProcessedVideoData | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Workspace Ref for jumping to timestamps
  const workspaceRef = useRef<VideoWorkspaceRef>(null);

  // Dashboard State
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    critical: false,
    major: false,
    minor: true
  });

  // Check Local Storage on Mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('pw_proofvision_auth');
    if (storedAuth) {
      try {
        const { name, key } = JSON.parse(storedAuth);
        if (name && key) {
          setUserName(name);
          setApiKey(key);
          setStep('upload');
        }
      } catch (e) {
        console.error("Auth parsing failed", e);
      }
    }
  }, []);

  // Handle Login
  const handleLogin = (name: string, key: string) => {
    localStorage.setItem('pw_proofvision_auth', JSON.stringify({ name, key }));
    setUserName(name);
    setApiKey(key);
    setStep('upload');
  };

  // Handle Auth Updates from Settings
  const handleAuthUpdate = (name: string, key: string) => {
     localStorage.setItem('pw_proofvision_auth', JSON.stringify({ name, key }));
     setUserName(name);
     setApiKey(key);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('pw_proofvision_auth');
    setUserName('');
    setApiKey('');
    setResults(null);
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setStep('login');
  };

  // Warn on refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 'analyzing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  // Cleanup video URL
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // STEP 1: Handle Upload & Preview
  const handleUpload = async (uploadedFile: File, selectedPlatform: string, title?: string, url?: string) => {
    setFile(uploadedFile);
    setPlatform(selectedPlatform);
    setVideoTitle(title || uploadedFile.name);
    setChannelUrl(url || '');
    setError(null);
    setProcessedVideo(null); 
    setIsAiProcessing(false);
    
    // Create Object URL for playback
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const urlObj = URL.createObjectURL(uploadedFile);
    setVideoUrl(urlObj);

    setProcessedVideo({ 
        fileUri: 'pending-upload', 
        mimeType: uploadedFile.type, 
        state: 'ACTIVE' 
    });
    setStep('analyzing');
    setAnalysisStatus("Video ready for upload");
  };

  // STEP 2: Trigger AI Analysis (File API Strategy)
  const handleStartAnalysis = async () => {
    if (!file || !apiKey) return;
    
    setIsAiProcessing(true);
    setAnalysisStatus("Initializing upload...");

    try {
       // Phase 1: Upload to Google (File API)
       const { uri, duration } = await uploadFileToGemini(file, apiKey, (status) => setAnalysisStatus(status));
       
       // Phase 2: Analyze
       const data = await runGeminiAnalysis(
         uri,
         videoTitle,
         platform,
         duration,
         apiKey,
         channelUrl, // Pass the channel URL for context
         (status) => setAnalysisStatus(status)
       );
       
       setResults(data);
       setStep('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed.");
      setIsAiProcessing(false);
    }
  };

  const handleJump = (timestamp: string) => {
    const seconds = parseTimestamp(timestamp);
    workspaceRef.current?.jumpTo(seconds);
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleIssueFix = (id: string) => {
    if (!results) return;
    const updatedIssues = results.issues.map(i => 
      i.id === id ? { ...i, fixed: true } : i
    );
    setResults({ ...results, issues: updatedIssues });
  };

  const handleReAnalyze = () => {
    setResults(null);
    setFile(null);
    setVideoUrl(null);
    setProcessedVideo(null);
    setStep('upload');
  }

  // Group Issues
  const criticalIssues = results?.issues.filter(i => i.severity === 'critical') || [];
  const majorIssues = results?.issues.filter(i => i.severity === 'major') || [];
  const minorIssues = results?.issues.filter(i => ['minor', 'suggestion'].includes(i.severity)) || [];

  if (step === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header userName={userName} onLogout={handleLogout} onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="relative">
        {error && (
          <div className="mx-auto mt-4 max-w-4xl rounded-md bg-red-50 p-4 text-red-700">
            <div className="flex">
              <AlertTriangle className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {step === 'upload' && <UploadStep onUpload={handleUpload} />}
        
        {step === 'analyzing' && file && (
          <AnalysisProgress 
            fileName={file.name} 
            videoData={processedVideo}
            videoUrl={videoUrl}
            onStartAnalysis={handleStartAnalysis}
            currentStatus={analysisStatus}
            isAiProcessing={isAiProcessing}
          />
        )}

        {step === 'dashboard' && results && (
          <div className="h-[calc(100vh-64px)] overflow-hidden">
            {/* Dashboard Sticky Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
               <div className="flex items-center space-x-4">
                 <h2 className="font-heading text-lg font-bold text-gray-800 truncate max-w-[200px] sm:max-w-md">{results.videoTitle}</h2>
                 <div className="flex items-center space-x-2 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                   <ShieldCheck size={16} />
                   <span>Score: {results.score}/100</span>
                 </div>
               </div>
               <div className="flex items-center space-x-3">
                 <button onClick={handleReAnalyze} className="hidden sm:flex items-center space-x-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <RefreshCcw size={16} />
                    <span>Re-analyze</span>
                 </button>
                 <button onClick={() => setIsExportOpen(true)} className="flex items-center space-x-2 rounded-lg bg-pw-orange px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600">
                    <Download size={16} />
                    <span className="hidden sm:inline">Export</span>
                 </button>
               </div>
            </div>

            {/* Split View */}
            <div className="flex h-[calc(100%-64px)] flex-col lg:flex-row">
              {/* Left: Video Player Workspace */}
              <VideoWorkspace 
                ref={workspaceRef}
                videoUrl={videoUrl}
                issues={results.issues}
              />

              {/* Right: Issues & Analysis */}
              <div className="flex h-1/2 w-full flex-col bg-gray-50 lg:h-full lg:w-7/12 xl:w-1/2">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white">
                  <button 
                    onClick={() => setActiveTab('issues')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'issues' ? 'border-b-2 border-pw-orange text-pw-orange' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Issues ({results.issues.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('marketing')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'marketing' ? 'border-b-2 border-pw-orange text-pw-orange' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Marketing Analysis
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
                  {activeTab === 'issues' ? (
                    <div className="space-y-6">
                      
                      {/* Critical Section */}
                      {criticalIssues.length > 0 && (
                        <div>
                          <div 
                            className="mb-3 flex cursor-pointer items-center justify-between"
                            onClick={() => toggleSection('critical')}
                          >
                            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-red-600">
                              <span className="mr-2 h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                              Critical Issues ({criticalIssues.length})
                            </h3>
                            {collapsedSections.critical ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          </div>
                          {!collapsedSections.critical && criticalIssues.map(issue => (
                            <IssueCard 
                              key={issue.id} 
                              issue={issue} 
                              onJump={handleJump} 
                              onFix={handleIssueFix} 
                            />
                          ))}
                        </div>
                      )}

                      {/* Major Section */}
                      {majorIssues.length > 0 && (
                        <div>
                          <div 
                            className="mb-3 flex cursor-pointer items-center justify-between"
                            onClick={() => toggleSection('major')}
                          >
                             <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-amber-600">
                              <span className="mr-2 h-2 w-2 rounded-full bg-amber-600"></span>
                              Major Issues ({majorIssues.length})
                            </h3>
                             {collapsedSections.major ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          </div>
                          {!collapsedSections.major && majorIssues.map(issue => (
                             <IssueCard 
                                key={issue.id} 
                                issue={issue} 
                                onJump={handleJump} 
                                onFix={handleIssueFix} 
                              />
                          ))}
                        </div>
                      )}

                      {/* Minor Section */}
                       {minorIssues.length > 0 && (
                        <div>
                          <div 
                            className="mb-3 flex cursor-pointer items-center justify-between"
                            onClick={() => toggleSection('minor')}
                          >
                             <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-green-600">
                              <span className="mr-2 h-2 w-2 rounded-full bg-green-600"></span>
                              Minor & Suggestions ({minorIssues.length})
                            </h3>
                             {collapsedSections.minor ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          </div>
                          {!collapsedSections.minor && minorIssues.map(issue => (
                             <IssueCard 
                                key={issue.id} 
                                issue={issue} 
                                onJump={handleJump} 
                                onFix={handleIssueFix} 
                              />
                          ))}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="space-y-6">
                      <MarketingPanel data={results.marketing} />
                      
                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center font-heading text-lg font-semibold text-pw-blue">
                          <Youtube size={20} className="mr-2 text-red-600" /> Platform Fit: {results.platform}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                           <FitItem label="Aspect Ratio" pass={results.platformFit.aspectRatio} value={results.platformFit.aspectRatio ? "16:9" : "Invalid"} />
                           <FitItem label="Duration" pass={results.platformFit.duration} value={results.duration || "N/A"} />
                           <FitItem label="Captions" pass={results.platformFit.captions} value={results.platformFit.captions ? "Detected" : "Missing"} />
                           <FitItem label="Thumbnail" pass={results.platformFit.thumbnail !== 'low'} value={results.platformFit.thumbnail.toUpperCase()} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <ExportModal 
          isOpen={isExportOpen} 
          onClose={() => setIsExportOpen(false)} 
          results={results}
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={userName}
          currentKey={apiKey}
          onSave={handleAuthUpdate}
        />
      </main>
    </div>
  );
}