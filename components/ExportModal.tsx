import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, FileCode, Download, Link2, Check, Loader2 } from 'lucide-react';
import { AnalysisResult } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: AnalysisResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, results }) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !results) return null;

  const handleDownload = async () => {
    if (!results) return;
    setIsGenerating(true);

    try {
      await new Promise(r => setTimeout(r, 100)); // UI update

      if (selectedFormat === 'json') {
        const content = JSON.stringify(results, null, 2);
        downloadFile(content, 'application/json', 'json', results.videoTitle);
      } else if (selectedFormat === 'csv') {
        const headers = "Timestamp,Type,Severity,Description,Impact,Status\n";
        const rows = results.issues.map(i => 
          `"${i.timestamp}","${i.type}","${i.severity}","${i.description}","${i.impact}","${i.fixed ? 'Fixed' : 'Open'}"`
        ).join("\n");
        downloadFile(headers + rows, 'text/csv', 'csv', results.videoTitle);
      } else {
        generatePDF(results);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate export");
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const generatePDF = (data: AnalysisResult) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 107, 53); // PW Orange
    doc.text("PW ProofVision Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Video: ${data.videoTitle}`, 14, 28);
    doc.text(`Score: ${data.score}/100`, 14, 33);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

    // Summary
    doc.setDrawColor(200);
    doc.line(14, 42, 196, 42);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, 50);
    doc.setFontSize(10);
    doc.text(`This video has a marketing score of ${data.marketing.overallScore}. Found ${data.issues.length} issues.`, 14, 56);

    // Issues Table
    const tableData = data.issues.map(i => [
      i.timestamp,
      i.severity.toUpperCase(),
      i.type,
      i.description,
      i.fixed ? 'Fixed' : 'Open'
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Time', 'Severity', 'Type', 'Description', 'Status']],
      body: tableData,
      headStyles: { fillColor: [30, 58, 138] }, // PW Blue
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 20 }
      }
    });

    // Marketing Section
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.text("Marketing Analysis", 14, finalY);
    doc.setFontSize(10);
    doc.text(`Hook Score: ${data.marketing.hookScore}/10 - ${data.marketing.hookFeedback}`, 14, finalY + 7);
    doc.text(`CTA Score: ${data.marketing.ctaScore}/10 - ${data.marketing.ctaFeedback}`, 14, finalY + 12);

    doc.save(`ProofVision_${data.videoTitle.substring(0, 10)}.pdf`);
  };

  const downloadFile = (content: string, mime: string, ext: string, title: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PW_ProofVision_${title.replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" aria-modal="true" role="dialog">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-heading text-xl font-semibold text-pw-blue">Export Analysis Report</h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close export modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Select Format</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormatOption 
              icon={<FileText size={24} />} 
              label="PDF" 
              sub="Print View" 
              active={selectedFormat === 'pdf'} 
              onClick={() => setSelectedFormat('pdf')}
            />
            <FormatOption 
              icon={<FileSpreadsheet size={24} />} 
              label="CSV" 
              sub="Spreadsheet" 
              active={selectedFormat === 'csv'}
              onClick={() => setSelectedFormat('csv')}
            />
            <FormatOption 
              icon={<FileCode size={24} />} 
              label="JSON" 
              sub="Raw Data" 
              active={selectedFormat === 'json'}
              onClick={() => setSelectedFormat('json')}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex flex-1 items-center justify-center rounded-lg bg-pw-orange py-3 font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="animate-spin mr-2" size={18} /> : <Download size={18} className="mr-2" />}
              {isGenerating ? 'Generating...' : 'Download Report'}
            </button>
            <button 
              onClick={handleCopyLink}
              className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 min-w-[50px]"
              aria-label="Copy link to clipboard"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Link2 size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormatOption = ({ icon, label, sub, active, onClick }: { icon: React.ReactNode, label: string, sub: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${active ? 'border-pw-orange bg-orange-50' : 'border-gray-100 hover:border-pw-orange/50'}`}
  >
    <div className={`mb-2 ${active ? 'text-pw-orange' : 'text-gray-400'}`}>{icon}</div>
    <span className={`font-bold ${active ? 'text-pw-blue' : 'text-gray-700'}`}>{label}</span>
    <span className="text-xs text-gray-400">{sub}</span>
  </button>
);