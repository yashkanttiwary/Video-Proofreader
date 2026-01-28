
export type IssueSeverity = 'critical' | 'major' | 'minor' | 'suggestion';
export type IssueType = 'spelling' | 'factual' | 'clarity' | 'marketing' | 'platform';

export interface Issue {
  id: string;
  timestamp: string; // "MM:SS"
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  found?: string;
  shouldBe?: string;
  impact?: string;
  fixed: boolean;
}

export interface MarketingData {
  hookScore: number;
  hookFeedback: string;
  retentionCurve: { time: string; value: number; label?: string }[];
  ctaScore: number;
  ctaFeedback: string;
  overallScore: number;
}

export interface PlatformFit {
  platform: 'YouTube' | 'Shorts' | 'Instagram' | 'Reels';
  aspectRatio: boolean;
  duration: boolean;
  thumbnail: 'low' | 'medium' | 'high';
  captions: boolean;
}

export interface AnalysisResult {
  videoTitle: string;
  score: number;
  duration: string;
  platform: string;
  issues: Issue[];
  marketing: MarketingData;
  platformFit: PlatformFit;
}

export interface ProcessedVideoData {
  fileUri: string;
  mimeType: string;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

export type AppStep = 'login' | 'upload' | 'analyzing' | 'dashboard';
