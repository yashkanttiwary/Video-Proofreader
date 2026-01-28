import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Issue } from '../types';

interface VideoWorkspaceProps {
  videoUrl: string | null;
  issues: Issue[];
  onTimeUpdate?: (time: number) => void;
}

export interface VideoWorkspaceRef {
  jumpTo: (time: number) => void;
  play: () => void;
  pause: () => void;
}

const parseTimestamp = (timeStr: string): number => {
  try {
    const parts = timeStr.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    return 0;
  } catch (e) { return 0; }
};

const formatTime = (time: number) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoWorkspace = forwardRef<VideoWorkspaceRef, VideoWorkspaceProps>(({ videoUrl, issues, onTimeUpdate }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(ref, () => ({
    jumpTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (videoRef.current.paused) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
             playPromise.catch(() => {}); // Prevent race condition error
          }
        }
        setIsPlaying(true);
      }
    },
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause()
  }));

  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.log("Interrupted play", e));
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      if (onTimeUpdate) onTimeUpdate(t);
    }
  };

  return (
    <div className="flex h-1/2 w-full flex-col bg-black lg:h-full lg:w-5/12 xl:w-1/2 relative group">
      <div className="relative h-full w-full flex items-center justify-center bg-zinc-900">
        {videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full max-h-full object-contain"
            onTimeUpdate={onUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={handlePlayToggle}
          />
        ) : (
          <div className="text-white">Video Source Missing</div>
        )}
        
        {/* Play Overlay Button */}
        {!isPlaying && (
           <div 
             onClick={handlePlayToggle}
             className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 cursor-pointer transition-colors"
           >
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
               <Play size={32} className="ml-1 text-white" fill="currentColor" />
             </div>
           </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-xs font-mono text-white mb-2">
           <span>{formatTime(currentTime)}</span>
           <span>{formatTime(duration)}</span>
        </div>
        <div 
          className="relative h-2 w-full cursor-pointer rounded-full bg-white/30 hover:h-3 transition-all"
          onClick={(e) => {
            if (videoRef.current && duration) {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              videoRef.current.currentTime = pos * duration;
            }
          }}
        >
           <div 
             className="absolute left-0 top-0 h-full rounded-full bg-pw-orange" 
             style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
           ></div>
           
           {/* Issue Markers */}
           {issues.map(issue => {
             const issueTime = parseTimestamp(issue.timestamp);
             const pct = (issueTime / (duration || 1)) * 100;
             if (pct > 100) return null;
             const colorClass = issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'major' ? 'bg-amber-500' : 'bg-green-500';
             
             return (
               <div 
                 key={issue.id}
                 className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white ${colorClass} hover:scale-150 transition-transform cursor-pointer`}
                 style={{ left: `${pct}%` }}
                 title={`${issue.timestamp}: ${issue.description}`}
                 onClick={(e) => {
                   e.stopPropagation();
                   if (videoRef.current) {
                     videoRef.current.currentTime = issueTime;
                   }
                 }}
               ></div>
             );
           })}
        </div>
      </div>
    </div>
  );
});

VideoWorkspace.displayName = "VideoWorkspace";
