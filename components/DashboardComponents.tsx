import React from 'react';
import { Issue, IssueSeverity, MarketingData } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Clock, 
  Play,
  SpellCheck,
  TrendingUp,
  Monitor,
  Lightbulb,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Helper Functions ---
const getSeverityColor = (severity: IssueSeverity) => {
  switch (severity) {
    case 'critical': return 'border-pw-critical bg-red-50 text-pw-critical';
    case 'major': return 'border-pw-warning bg-amber-50 text-pw-warning';
    case 'minor': return 'border-pw-success bg-green-50 text-pw-success';
    case 'suggestion': return 'border-pw-blue bg-blue-50 text-pw-blue';
    default: return 'border-gray-200 bg-gray-50 text-gray-600';
  }
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'spelling': return <SpellCheck size={18} />;
    case 'factual': return <AlertOctagon size={18} />;
    case 'marketing': return <TrendingUp size={18} />;
    case 'platform': return <Monitor size={18} />;
    default: return <Lightbulb size={18} />;
  }
};

// --- Issue Card Component ---
interface IssueCardProps {
  issue: Issue;
  onJump: (timestamp: string) => void;
  onFix: (id: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onJump, onFix }) => {
  const [expanded, setExpanded] = React.useState(issue.severity === 'critical');

  return (
    <div 
      className={`relative mb-3 rounded-lg border-l-4 bg-white shadow-sm transition-all hover:shadow-md ${
        issue.fixed ? 'opacity-50' : ''
      } ${getSeverityColor(issue.severity).split(' ')[0]}`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onJump(issue.timestamp); }}
              className="flex items-center space-x-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-mono font-medium text-gray-600 hover:bg-pw-orange hover:text-white transition-colors"
            >
              <Clock size={12} />
              <span>{issue.timestamp}</span>
            </button>
            <div className={`flex items-center space-x-2 ${getSeverityColor(issue.severity).split(' ')[2]}`}>
               {getIconForType(issue.type)}
               <span className="text-sm font-semibold uppercase">{issue.type}</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getSeverityColor(issue.severity)}`}>
            {issue.severity}
          </span>
        </div>

        <p className="mt-2 text-sm font-medium text-gray-800 line-clamp-1">
            {issue.description}
        </p>

        {expanded && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
             {/* Comparison Box */}
             {(issue.found || issue.shouldBe) && (
               <div className="mb-3 rounded bg-gray-50 p-3 text-sm">
                 {issue.found && (
                   <div className="flex items-start mb-1">
                     <X size={14} className="mt-1 mr-2 text-red-500" />
                     <span className="text-gray-500 line-through decoration-red-500/50">{issue.found}</span>
                   </div>
                 )}
                 {issue.shouldBe && (
                   <div className="flex items-start">
                     <CheckCircle2 size={14} className="mt-1 mr-2 text-green-600" />
                     <span className="font-semibold text-gray-900">{issue.shouldBe}</span>
                   </div>
                 )}
               </div>
             )}
             
             <p className="mb-3 text-xs text-gray-500">
               <span className="font-semibold">Impact:</span> {issue.impact}
             </p>

             <div className="flex space-x-2">
               <button 
                 onClick={(e) => { e.stopPropagation(); onJump(issue.timestamp); }}
                 className="flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
               >
                 <Play size={12} className="mr-1.5" /> Jump to Frame
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); onFix(issue.id); }}
                  disabled={issue.fixed}
                  className={`flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    issue.fixed 
                      ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                      : 'bg-pw-orange text-white hover:bg-orange-600'
                  }`}
               >
                 <CheckCircle2 size={12} className="mr-1.5" />
                 {issue.fixed ? 'Fixed' : 'Mark as Fixed'}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Marketing Panel Component ---
interface MarketingPanelProps {
  data: MarketingData;
}

export const MarketingPanel: React.FC<MarketingPanelProps> = ({ data }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-pw-blue">Marketing Analysis</h3>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
          {data.overallScore}/100
        </span>
      </div>

      <div className="space-y-6">
        {/* Hook Analysis */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">Hook Strength</span>
            <span className="font-bold text-pw-orange">{data.hookScore}/10</span>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-pw-orange" style={{ width: `${data.hookScore * 10}%` }}></div>
          </div>
          <p className="text-xs text-gray-600 bg-orange-50 p-3 rounded-md border border-orange-100">
            <span className="font-semibold text-orange-800">Feedback: </span>
            {data.hookFeedback}
          </p>
        </div>

        {/* Retention Chart */}
        <div className="h-48 w-full rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Retention Prediction</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.retentionCurve}>
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1E3A8A', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#1E3A8A" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#1E3A8A', strokeWidth: 0 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

         {/* CTA Analysis */}
         <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">CTA Effectiveness</span>
            <span className="font-bold text-green-600">{data.ctaScore}/10</span>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-green-500" style={{ width: `${data.ctaScore * 10}%` }}></div>
          </div>
          <p className="text-xs text-gray-600 bg-green-50 p-3 rounded-md border border-green-100">
             {data.ctaFeedback}
          </p>
        </div>
      </div>
    </div>
  );
};
