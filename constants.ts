import { AnalysisResult } from './types';

// RAG (Retrieval-Augmented Generation) Knowledge Base
// In a real app, this would be fetched from a vector DB based on the channel ID
export const CHANNEL_CONTEXT = {
  channelName: "Physics Wallah - Alakh Pandey",
  topPerformingPatterns: {
    hookDuration: "0-15 seconds",
    avgViewDuration: "8:45",
    winningFormats: ["Problem-Solution", "Concept derivation", "Exam strategy"],
    commonPitfalls: ["Long generic intros", "Blurry handwriting on whiteboards", "Low energy voice modulation"]
  },
  brandGuidelines: {
    tone: "Energetic, Mentorship, Authentic",
    visuals: "Clear hand-written notes, High contrast overlays",
    colors: ["#FF6B35", "#FFFFFF", "#000000"]
  }
};

export const SAMPLE_ANALYSIS: AnalysisResult = {
  videoTitle: "Physics_Lecture_23.mp4",
  score: 89,
  duration: "12:34",
  platform: "YouTube",
  issues: [
    {
      id: "1",
      timestamp: "00:01:23",
      type: "spelling",
      severity: "critical",
      description: "Main title overlay missing apostrophe",
      found: "Newtons Third Law",
      shouldBe: "Newton's Third Law",
      impact: "Factual incorrectness in core concept title",
      fixed: false
    },
    {
      id: "2",
      timestamp: "00:05:47",
      type: "factual",
      severity: "critical",
      description: "Incorrect formula stated",
      found: "F = m × a",
      shouldBe: "F = ma (Vector notation preferred)",
      impact: "Confusing notation for JEE aspirants",
      fixed: false
    },
    {
      id: "3",
      timestamp: "00:08:12",
      type: "clarity",
      severity: "major",
      description: "Audio dips significantly during key explanation",
      impact: "Difficult to hear 'Conservation of Momentum'",
      fixed: false
    },
    {
      id: "4",
      timestamp: "00:00:15",
      type: "marketing",
      severity: "suggestion",
      description: "Hook is too generic",
      impact: "Low initial retention predicted",
      fixed: false
    },
    {
      id: "5",
      timestamp: "00:12:20",
      type: "platform",
      severity: "minor",
      description: "CTA is late",
      impact: "Viewers may drop off before subscribing",
      fixed: false
    }
  ],
  marketing: {
    overallScore: 72,
    hookScore: 6,
    hookFeedback: "Generic opening. Suggest: Start with a question like 'Why do astronauts float?'",
    ctaScore: 8,
    ctaFeedback: "Clear placement at 12:20, but consider adding social proof overlay.",
    retentionCurve: [
      { time: "0:00", value: 100 },
      { time: "2:00", value: 85 },
      { time: "4:00", value: 80 },
      { time: "6:00", value: 75 },
      { time: "8:00", value: 60 },
      { time: "10:00", value: 55 },
      { time: "12:34", value: 45 }
    ]
  },
  platformFit: {
    platform: "YouTube",
    aspectRatio: true,
    duration: true,
    thumbnail: "low",
    captions: true
  }
};