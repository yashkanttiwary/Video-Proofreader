
import React from 'react';
import { Loader2, Zap, FileVideo, CheckCircle2, BrainCircuit, HardDrive, Video, CloudUpload, Cpu } from 'lucide-react';
import { ProcessedVideoData } from '../types';

interface AnalysisProgressProps {
  fileName: string;
  videoData: ProcessedVideoData | null;
  videoUrl: string | null;
  onStartAnalysis: () => void;
  currentStatus: string;
  isAiProcessing: boolean;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ 
  fileName, 
  videoData,
  videoUrl,
  onStartAnalysis, 
  currentStatus,
  isAiProcessing
}) => {

  const isReady = !!videoData;

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-gray-50 p-6">
      <div className="flex h-[80vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5">
        
        {/* LEFT PANEL: Process & Stats */}
        <div className="flex w-full max-w-md flex-col border-r border-gray-100 bg-white p-8">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="mb-2 font-heading text-2xl font-bold text-pw-blue">Deep Video Analysis</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
               <FileVideo size={14} />
               <span className="truncate max-w-[200px]">{fileName}</span>
            </div>
          </div>

          {/* Timeline / Status Steps */}
          <div className="flex-1 space-y-8">
            
            {/* Step 1: Video Preparation */}
            <div className="relative pl-8">
              <div className={`absolute left-0 top-1 h-full w-0.5 ${isReady ? 'bg-pw-orange' : 'bg-gray-200'}`}></div>
              <div className={`absolute left-[-5px] top-0 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white ${
                 isReady ? 'bg-pw-orange' : 'bg-gray-200'
              }`}></div>
              
              <h3 className={`font-semibold ${isReady ? 'text-gray-900' : 'text-gray-400'}`}>File Staging</h3>
              <p className="text-sm text-gray-500 mt-1">
                {!isReady ? 'Reading file...' : 'Ready for upload'}
              </p>
              {isReady && !isAiProcessing && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                   <StatBadge icon={<CloudUpload size={14}/>} label="Strategy" value="File API" />
                   <StatBadge icon={<Video size={14}/>} label="Mode" value="High Res" />
                </div>
              )}
            </div>

            {/* Step 2: AI Processing */}
            <div className="relative pl-8">
               <div className={`absolute left-[-5px] top-0 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white ${
                 isAiProcessing ? 'bg-pw-blue animate-pulse' : 'bg-gray-200'
              }`}></div>
               <h3 className={`font-semibold ${isAiProcessing ? 'text-pw-blue' : 'text-gray-400'}`}>Gemini 3.0 Pro Analysis</h3>
               
               {isAiProcessing ? (
                 <div className="mt-4 space-y-3">
                    <StatusStep 
                        label="Upload to Google" 
                        isActive={currentStatus.includes("Uploading")} 
                        isDone={!currentStatus.includes("Uploading") && (currentStatus.includes("Processing") || currentStatus.includes("Analyzing"))} 
                    />
                    <StatusStep 
                        label="Server Processing" 
                        isActive={currentStatus.includes("Processing")} 
                        isDone={!currentStatus.includes("Processing") && currentStatus.includes("Analyzing")} 
                    />
                    <StatusStep 
                        label="Frame Analysis" 
                        isActive={currentStatus.includes("Analyzing")} 
                        isDone={false} 
                    />
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 mt-1">Waiting to start...</p>
               )}
            </div>

          </div>

          {/* Action Area */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            {!isAiProcessing ? (
               <button 
                 onClick={onStartAnalysis}
                 disabled={!isReady}
                 className="group flex w-full items-center justify-center space-x-3 rounded-xl bg-pw-blue px-6 py-4 font-bold text-white shadow-lg transition-all hover:bg-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
               >
                 {!isReady ? (
                   <>
                     <Loader2 className="animate-spin" />
                     <span>Reading File...</span>
                   </>
                 ) : (
                   <>
                     <Zap className="fill-current" />
                     <span>Start File API Upload</span>
                   </>
                 )}
               </button>
            ) : (
               <div className="flex w-full items-center justify-center space-x-3 rounded-xl bg-gray-100 px-6 py-4 font-medium text-gray-500">
                  <Loader2 className="animate-spin" />
                  <span>Processing Large File...</span>
               </div>
            )}
            <p className="mt-3 text-center text-xs text-gray-400">
               {isAiProcessing ? currentStatus : "Uses Google File API for 200MB+ support"}
            </p>
          </div>

        </div>

        {/* RIGHT PANEL: Video Preview */}
        <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
           {videoUrl ? (
             <video 
               src={videoUrl} 
               className="h-full w-full object-contain"
               controls={!isAiProcessing}
               autoPlay
               muted
               loop
             />
           ) : (
             <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Loading Video...</p>
             </div>
           )}
           
           <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-mono flex items-center space-x-2">
             <BrainCircuit size={14} className="text-pw-orange" />
             <span>AI Access: FILE URI</span>
           </div>
        </div>

      </div>
    </div>
  );
};

const StatBadge = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="flex items-center space-x-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
    <div className="text-gray-400">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const StatusStep = ({ label, isActive, isDone }: { label: string, isActive: boolean, isDone: boolean }) => (
  <div className="flex items-center space-x-3 text-sm">
    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
       isDone ? 'border-pw-success bg-pw-success text-white' : 
       isActive ? 'border-pw-blue text-pw-blue' : 'border-gray-200 text-gray-300'
    }`}>
      {isDone ? <CheckCircle2 size={14} /> : (isActive ? <Loader2 size={14} className="animate-spin" /> : <div className="h-2 w-2 rounded-full bg-current" />)}
    </div>
    <span className={isActive || isDone ? 'text-gray-900 font-medium' : 'text-gray-400'}>{label}</span>
  </div>
);
