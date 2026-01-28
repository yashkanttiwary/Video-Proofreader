import { GoogleGenAI, Type, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { CHANNEL_CONTEXT } from '../constants';
import { AnalysisResult, Issue, MarketingData } from '../types';

// --- Configuration ---
// Using gemini-3-pro-preview as it has the best context window for large video files (2GB+)
const MODEL_NAME = "gemini-3-pro-preview"; 
const CHUNK_SIZE_MINUTES = 20; // Break analysis into 20-minute segments to prevent "sleeping"

// --- 1. Tool Definition ---
const analysisTool = {
  functionDeclarations: [
    {
      name: "submit_video_analysis",
      description: "Submit the findings of the video proofreading analysis, including issues, marketing scores, and platform fit.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Overall quality score out of 100" },
          issues: {
            type: Type.ARRAY,
            description: "List of time-stamped issues found in the video",
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING, description: "HH:MM:SS or MM:SS format relative to video start (00:00:00)" },
                type: { type: Type.STRING, enum: ["spelling", "factual", "clarity", "marketing", "platform"] },
                severity: { type: Type.STRING, enum: ["critical", "major", "minor", "suggestion"] },
                description: { type: Type.STRING, description: "Short description of the issue" },
                found: { type: Type.STRING, description: "What was found (e.g., the typo)" },
                shouldBe: { type: Type.STRING, description: "The correction" },
                impact: { type: Type.STRING, description: "Why this matters" }
              },
              required: ["timestamp", "type", "severity", "description"]
            }
          },
          marketing: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              hookScore: { type: Type.NUMBER },
              hookFeedback: { type: Type.STRING },
              ctaScore: { type: Type.NUMBER },
              ctaFeedback: { type: Type.STRING },
              retentionCurve: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "HH:MM:SS or MM:SS format" },
                    value: { type: Type.NUMBER },
                    label: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["overallScore", "hookScore"]
          },
          platformFit: {
            type: Type.OBJECT,
            properties: {
              aspectRatio: { type: Type.BOOLEAN },
              duration: { type: Type.BOOLEAN },
              thumbnail: { type: Type.STRING, enum: ["low", "medium", "high"] },
              captions: { type: Type.BOOLEAN }
            },
            required: ["aspectRatio", "duration", "thumbnail", "captions"]
          }
        },
        required: ["score", "issues", "marketing", "platformFit"]
      }
    }
  ]
};

// --- 2. File API Logic ---

interface UploadResult {
  uri: string;
  duration: string; // Duration string from API (e.g. "1200s")
}

/**
 * Uploads a file to Gemini using the File API, polls for processing, and returns the URI and Duration.
 * Handles large files (up to 2GB) by offloading processing to Google's servers.
 */
export const uploadFileToGemini = async (
  file: File, 
  onStatusUpdate?: (status: string) => void
): Promise<UploadResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey });
  // Cast to any to avoid type errors if the SDK definition is incomplete in this version
  const aiClient = ai as any;

  try {
    // 1. Upload
    if (onStatusUpdate) onStatusUpdate("Uploading to Gemini...");
    
    // Using ai.files.upload
    const mimeType = file.type || "video/mp4";
    const uploadResponse = await aiClient.files.upload({
      file: file,
      config: { mimeType: mimeType }
    });

    // Handle different response structures from the SDK (wrapped in .file or direct)
    const uploadedFile = uploadResponse.file ?? uploadResponse;

    if (!uploadedFile || !uploadedFile.uri) {
      console.error("Unexpected Upload Response:", uploadResponse);
      throw new Error("Upload failed: Response missing file URI. The API might have changed.");
    }

    const fileUri = uploadedFile.uri;
    const fileName = uploadedFile.name;

    // 2. Poll for Active State
    // We must wait for state === 'ACTIVE' before the model can use the file
    if (onStatusUpdate) onStatusUpdate("Google is processing video...");
    
    let isProcessing = true;
    let duration = "";

    while (isProcessing) {
      const fileStatusResponse = await aiClient.files.get({ name: fileName });
      const fileStatus = fileStatusResponse.file ?? fileStatusResponse;
      
      if (fileStatus.state === 'ACTIVE') {
        isProcessing = false;
        // Capture duration from metadata if available
        duration = fileStatus.videoMetadata?.videoDuration || "";
        return { uri: fileUri, duration };
      } else if (fileStatus.state === 'FAILED') {
        throw new Error("Video processing failed on Google servers.");
      } else {
        // Still processing, wait 5 seconds before checking again
        if (onStatusUpdate) onStatusUpdate(`Google is processing video... (${fileStatus.state})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return { uri: fileUri, duration };

  } catch (error: any) {
    console.error("Upload failed:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Helper to parse duration string (e.g. "1234s") to seconds
 */
const parseDurationSeconds = (durationStr: string): number => {
  if (!durationStr) return 0;
  return parseInt(durationStr.replace('s', ''), 10);
};

// --- Timestamp Helpers ---
const parseTimestampToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  // Handle "1234s" format if raw seconds come back
  if (timeStr.endsWith('s') && !timeStr.includes(':')) {
    return parseInt(timeStr.replace('s', ''), 10);
  }
  const parts = timeStr.split(':').map(part => parseInt(part, 10));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(timeStr, 10) || 0;
};

const formatSecondsToTimestamp = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Runs analysis on an already uploaded file URI.
 * Implements Chunking Strategy for long videos.
 */
export const runGeminiAnalysis = async (
  fileUri: string,
  title: string,
  platform: string,
  durationStr: string,
  onStatusUpdate?: (status: string) => void
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  const durationSeconds = parseDurationSeconds(durationStr);
  const chunkSeconds = CHUNK_SIZE_MINUTES * 60;
  
  // Determine if we need to chunk
  const totalChunks = durationSeconds > 0 ? Math.ceil(durationSeconds / chunkSeconds) : 1;
  const useChunking = totalChunks > 1;

  if (useChunking && onStatusUpdate) {
    onStatusUpdate(`Video is long. Splitting into ${totalChunks} segments for deep analysis...`);
  }

  const results: AnalysisResult[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const startTime = i * chunkSeconds;
    const endTime = Math.min((i + 1) * chunkSeconds, durationSeconds);
    
    // Format HH:MM:SS for prompt (more robust than MM:SS for long videos)
    const startStr = formatSecondsToTimestamp(startTime);
    const endStr = formatSecondsToTimestamp(endTime);

    if (onStatusUpdate) {
      onStatusUpdate(useChunking 
        ? `Analyzing Segment ${i + 1}/${totalChunks} (${startStr} - ${endStr})...`
        : "Analyzing video frames (00:00 to end)..."
      );
    }

    const ragContext = `
      CONTEXT: CHANNEL KNOWLEDGE BASE (${CHANNEL_CONTEXT.channelName})
      - Visual Style: ${CHANNEL_CONTEXT.brandGuidelines.visuals}.
      - Common Pitfalls: ${CHANNEL_CONTEXT.topPerformingPatterns.commonPitfalls.join(", ")}.
    `;

    // Prompt optimized for SEGMENTS or FULL video
    const timeInstruction = useChunking 
      ? `CRITICAL INSTRUCTION: Analyze the video ONLY from timestamp ${startStr} to ${endStr}. This is segment ${i + 1} of ${totalChunks}.
         IMPORTANT: All reported timestamps MUST be ABSOLUTE timestamps relative to the video start (00:00:00), NOT relative to the segment start. 
         If you find an issue at 1 minute into this segment (which starts at ${startStr}), the timestamp should be ${formatSecondsToTimestamp(startTime + 60)}.`
      : `CRITICAL INSTRUCTION: Analyze the video from 00:00 to the very end. Do not stop in the middle.`;

    const prompt = `
      ${ragContext}
      Target Platform: ${platform}.
      Video Title: "${title}"

      ROLE: You are the Ultimate Video QA System for Physics Wallah.
      TASK: Perform a FRAME-BY-FRAME analysis.
      
      ${timeInstruction}

      CHECKS:
      1. Identify spelling errors in Hindi/English text overlays within this timeframe.
      2. Check physics formulas for accuracy within this timeframe.
      3. ${i === 0 ? "Analyze marketing hook (first 15s)." : "Skip marketing hook analysis for this segment."}
      4. ${i === totalChunks - 1 ? "Analyze CTA effectiveness at the end." : "Skip CTA analysis for this segment."}
      5. Call the function 'submit_video_analysis' with your findings for THIS segment.
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                fileData: {
                  mimeType: "video/mp4",
                  fileUri: fileUri
                }
              }
            ]
          }
        ],
        config: {
          tools: [analysisTool],
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          ],
        },
      });

      // Pass startTime to parseResponse for timestamp correction
      const chunkResult = parseResponse(response, title, platform, startTime, endTime);
      results.push(chunkResult);

    } catch (err) {
      console.error(`Error in chunk ${i + 1}:`, err);
      // Continue to next chunk even if one fails, to salvage data
      if (onStatusUpdate) onStatusUpdate(`Segment ${i + 1} failed, retrying next...`);
    }
  }

  if (results.length === 0) {
    throw new Error("Analysis failed to produce any results.");
  }

  if (onStatusUpdate) onStatusUpdate("Merging analysis data...");
  return mergeAnalysisResults(results, durationStr);
};

// --- Helper: Parse Single Response ---
const parseResponse = (
  response: any, 
  title: string, 
  platform: string, 
  segmentStart: number,
  segmentEnd: number
): AnalysisResult => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No response from AI");
  }

  const firstCandidate = candidates[0];
  const parts = firstCandidate.content?.parts;
  const functionCallPart = parts?.find((part: any) => part.functionCall);

  if (functionCallPart && functionCallPart.functionCall) {
    const fc = functionCallPart.functionCall;
    if (fc.name === "submit_video_analysis") {
      const args = fc.args as unknown as AnalysisResult;
      
      // FIX: Apply Timestamp Correction Logic
      // If AI returns relative timestamps (e.g. 00:05 for a segment starting at 20:00), 
      // we detect it and offset it.
      
      const correctedIssues = (args.issues || []).map(issue => {
        let seconds = parseTimestampToSeconds(issue.timestamp);
        
        // HEURISTIC: If the timestamp is significantly smaller than the segment start
        // (and it's not the first segment), it's likely relative.
        if (segmentStart > 0 && seconds < segmentStart) {
          seconds += segmentStart;
        }
        
        return {
          ...issue,
          timestamp: formatSecondsToTimestamp(seconds)
        };
      });

      // Fix retention curve timestamps as well if they exist
      const correctedRetention = args.marketing?.retentionCurve?.map(point => {
        let seconds = parseTimestampToSeconds(point.time);
         if (segmentStart > 0 && seconds < segmentStart) {
          seconds += segmentStart;
        }
        return {
          ...point,
          time: formatSecondsToTimestamp(seconds)
        };
      }) || [];

      return {
        ...args,
        issues: correctedIssues,
        marketing: {
          ...args.marketing,
          retentionCurve: correctedRetention
        },
        videoTitle: title,
        platform: platform
      };
    }
  }
  
  throw new Error("AI returned text instead of structured data. Retrying recommended.");
};

// --- Helper: Merge Chunked Results ---
const mergeAnalysisResults = (results: AnalysisResult[], duration: string): AnalysisResult => {
  if (results.length === 1) return { ...results[0], duration };

  const first = results[0];
  const last = results[results.length - 1];

  // Merge Issues
  const allIssues: Issue[] = results.flatMap(r => r.issues || []);
  
  // Deduplicate issues by timestamp/description to be safe
  const uniqueIssues = Array.from(new Map(allIssues.map(item => [item.timestamp + item.description, item])).values());
  
  // Sort issues by time
  uniqueIssues.sort((a, b) => parseTimestampToSeconds(a.timestamp) - parseTimestampToSeconds(b.timestamp));

  // Average Scores
  const validScores = results.map(r => r.score).filter(s => typeof s === 'number');
  const avgScore = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  
  const validMarketingScores = results.map(r => r.marketing?.overallScore).filter(s => typeof s === 'number');
  const avgMarketingScore = Math.round(validMarketingScores.reduce((a, b) => a + b, 0) / validMarketingScores.length);

  // Combine Retention Curve (Sort by time)
  let combinedCurve = results.flatMap(r => r.marketing?.retentionCurve || []);
  combinedCurve.sort((a, b) => parseTimestampToSeconds(a.time) - parseTimestampToSeconds(b.time));
  
  // Deduplicate curve points by time
  combinedCurve = Array.from(new Map(combinedCurve.map(item => [item.time, item])).values());

  // Limit curve points to prevent UI overcrowding (take every Nth point if too many)
  if (combinedCurve.length > 20) {
    const step = Math.ceil(combinedCurve.length / 20);
    combinedCurve = combinedCurve.filter((_, i) => i % step === 0);
  }

  return {
    videoTitle: first.videoTitle,
    platform: first.platform,
    score: avgScore,
    duration: duration,
    issues: uniqueIssues,
    marketing: {
      overallScore: avgMarketingScore,
      hookScore: first.marketing?.hookScore || 0, // Hook is in first chunk
      hookFeedback: first.marketing?.hookFeedback || "No hook data found",
      ctaScore: last.marketing?.ctaScore || 0, // CTA is in last chunk
      ctaFeedback: last.marketing?.ctaFeedback || "No CTA data found",
      retentionCurve: combinedCurve
    },
    platformFit: first.platformFit // Assume platform fit applies to whole video
  };
};