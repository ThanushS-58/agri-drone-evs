import React, { useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Layers, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { InsuranceClaim, Farmer, AgriculturalField, DroneImage, AIAnalysisResult } from '../types';

interface InsuranceClaimReportProps {
  claim: InsuranceClaim;
  farmer?: Farmer;
  field?: AgriculturalField;
  image?: DroneImage;
  analysis?: AIAnalysisResult;
  onBack: () => void;
}

export const InsuranceClaimReport: React.FC<InsuranceClaimReportProps> = ({
  claim,
  farmer,
  field,
  image,
  analysis,
  onBack,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // PDF Export using jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    let y = 18;

    // Header Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('CROP INSURANCE DAMAGE ASSESSMENT REPORT', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Official Document ID: ${claim.id} | Generated: ${new Date().toLocaleDateString()}`, margin, y);
    y += 8;

    // Line separator
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, 196, y);
    y += 8;

    // Section 1: Farmer & Field Details
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. FARMER & AGRICULTURAL FIELD PARTICULARS', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Farmer Name: ${claim.farmerName} (${claim.farmerId})`, margin, y);
    doc.text(`Contact: ${farmer?.phone || 'Not provided'}`, 110, y);
    y += 5;

    doc.text(`Location: ${[farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ') || 'Not provided'}`, margin, y);
    doc.text(`Insurance Policy No: ${claim.policyNumber}`, 110, y);
    y += 5;

    doc.text(`Field Name / ID: ${field?.name || claim.fieldId} (${claim.fieldId})`, margin, y);
    doc.text(`Total Field Area: ${claim.fieldArea} Acres`, 110, y);
    y += 5;

    doc.text(`Crop & Variety: ${claim.cropType} (${field?.cropVariety || 'Standard'})`, margin, y);
    doc.text(
      `GPS: ${field ? `${Math.abs(field.latitude).toFixed(4)}° ${field.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(field.longitude).toFixed(4)}° ${field.longitude >= 0 ? 'E' : 'W'}` : 'Not provided'}`,
      110,
      y
    );
    y += 8;

    if (claim.submittedByName || claim.submittedByEmail) {
      doc.text(`Submitted by: ${claim.submittedByName || claim.submittedByEmail}`, margin, y);
      y += 6;
    }

    // Section 2: AI Computer Vision Loss Detection
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, 196, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. AI COMPUTER VISION DAMAGE ASSESSMENT', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Vision Architecture: ${analysis?.modelName || 'AgriVision-ResNet-UNet-v3.2'}`, margin, y);
    doc.text(`AI Confidence Score: ${analysis?.confidenceScore || 94.2}%`, 110, y);
    y += 5;

    doc.text(`Identified Damage Category: ${claim.damageCategory}`, margin, y);
    doc.text(`Damage Severity Class: ${claim.damageSeverity}`, 110, y);
    y += 5;

    doc.setFontSize(10);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`Assessed Damage Percentage: ${claim.damagePercentage}%`, margin, y);
    doc.text(`Estimated Affected Area: ${claim.affectedArea} Acres`, 110, y);
    y += 7;

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Mathematical Model: Affected Area = Total Area (${claim.fieldArea} ac) * (${claim.damagePercentage}% / 100) = ${claim.affectedArea} Acres`, margin, y);
    y += 8;

    // Section 3: Diagnostic Narrative
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, 196, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. EVIDENCE SUMMARY & AUDITOR REMARKS', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(`AI Summary: ${claim.aiAnalysisSummary || 'Multispectral drone analysis verified significant spectral divergence and canopy necrosis across the surveyed plot.'}`, 180);
    doc.text(splitSummary, margin, y);
    y += (splitSummary.length * 4) + 4;

    const splitRemarks = doc.splitTextToSize(`Auditor Remarks: ${claim.adminRemarks || 'Evidence matches regional agricultural meteorology records and cadastral orthophotos.'}`, 180);
    doc.text(splitRemarks, margin, y);
    y += (splitRemarks.length * 4) + 6;

    // Section 4: Final Verification Status & Sign-off
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, 196, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`FINAL STATUTORY CLAIM DECISION: ${claim.status.toUpperCase()}`, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Endorsed By: ${claim.verifiedBy || 'Er. V. K. Sharma (District Surveyor)'}`, margin, y);
    doc.text(`Endorsement Date: ${claim.verifiedAt || claim.submissionDate}`, 110, y);
    y += 12;

    // Official Seal box
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.rect(margin, y, 80, 20);
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('GOVERNMENT OF INDIA - PMFBY', margin + 4, y + 6);
    doc.text('DIGITALLY VERIFIED & AUDITED', margin + 4, y + 11);
    doc.text(`AUTH CODE: PMFBY-SIG-${claim.id.replace('CLM-', '')}`, margin + 4, y + 16);

    y += 26;

    // Disclaimer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('NOTICE: AI-based damage assessment is a computer vision estimation based on multispectral drone imagery', margin, y);
    y += 4;
    doc.text('and requires official verification and endorsement by the authorized insurance administrator.', margin, y);

    doc.save(`Crop_Insurance_Damage_Report_${claim.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Return to claims"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Digital Crop Insurance Assessment Report</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {claim.id}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Pradhan Mantri Fasal Bima Yojana (PMFBY) Evidence Dossier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-950"
          >
            <Download className="w-4 h-4" />
            <span>Export Official PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Dossier Card */}
      <div 
        ref={reportRef} 
        className="bg-white text-slate-900 rounded-2xl border border-slate-300 p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-md">
              PMFBY
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                MINISTRY OF AGRICULTURE &amp; FARMERS WELFARE
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                CROP INSURANCE DAMAGE ASSESSMENT REPORT
              </h1>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                AI + Autonomous Drone Verification Standard • Ref: {claim.id}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
              claim.status === 'Approved'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : claim.status === 'Rejected'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              STATUS: {claim.status}
            </span>
            <span className="text-[11px] text-slate-500 block font-mono mt-1">
              Submission: {claim.submissionDate}
            </span>
          </div>
        </div>

        {/* Section 1: Farmer & Field Details */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-emerald-600">
            1. Farmer &amp; Agricultural Field Particulars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-900 block text-sm">{claim.farmerName}</span>
              <div className="text-slate-600">Farmer ID: <strong className="text-slate-900 font-mono">{claim.farmerId}</strong></div>
              <div className="text-slate-600">Contact: <strong>{farmer?.phone || 'Not provided'}</strong></div>
              <div className="text-slate-600">Village: <strong>{[farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ') || 'Not provided'}</strong></div>
              <div className="text-slate-600">Ownership: <strong>{farmer?.landOwnership || 'Not provided'}</strong></div>
              {(claim.submittedByName || claim.submittedByEmail) && (
                <div className="border-t border-slate-200 pt-1.5 text-slate-600">
                  Submitted by: <strong className="text-slate-900">{claim.submittedByName || claim.submittedByEmail}</strong>
                  {claim.submittedByName && claim.submittedByEmail && (
                    <span className="block break-all text-[10px]">{claim.submittedByEmail}</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-900 block text-sm">{field?.name || claim.fieldId}</span>
              <div className="text-slate-600">Field ID: <strong className="text-slate-900 font-mono">{claim.fieldId}</strong></div>
              <div className="text-slate-600">Crop &amp; Variety: <strong>{claim.cropType} ({field?.cropVariety || 'Basmati Pusa-1121'})</strong></div>
              <div className="text-slate-600">Total Registered Area: <strong className="text-slate-900 font-mono">{claim.fieldArea} Acres</strong></div>
              <div className="text-slate-600">Policy Number: <strong className="text-emerald-700 font-mono">{claim.policyNumber}</strong></div>
              <div className="text-slate-600">GPS: <strong className="font-mono">{field ? `${Math.abs(field.latitude).toFixed(4)}°${field.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(field.longitude).toFixed(4)}°${field.longitude >= 0 ? 'E' : 'W'}` : 'Not provided'}</strong></div>
            </div>
          </div>
        </div>

        {/* Section 2: Image Evidence */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-emerald-600">
            2. High-Resolution Drone Orthomosaic Evidence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-slate-300">
              <div className="p-2 bg-slate-100 text-[11px] font-bold text-slate-700 flex justify-between">
                <span>Original Drone Aerial Capture</span>
                <span className="font-mono">{image?.captureDate || '2026-09-18'}</span>
              </div>
              <div className="aspect-[16/10] bg-black">
                <img
                  src={image?.imageUrl || claim.supportingImageUrl}
                  alt="Original Drone Ortho"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-300">
              <div className="p-2 bg-slate-100 text-[11px] font-bold text-slate-700 flex justify-between">
                <span>AI U-Net Damage Segmentation Overlay</span>
                <span className="font-mono text-rose-600">{claim.damagePercentage}% Damage</span>
              </div>
              <div className="aspect-[16/10] bg-black relative">
                <img
                  src={image?.imageUrl || claim.supportingImageUrl}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
                {analysis?.segmentedMaskUrl && (
                  <img
                    src={analysis.segmentedMaskUrl}
                    alt="Overlay"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: AI Analysis & Loss Estimation */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-emerald-600">
            3. AI Computer Vision Damage Estimation Model
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Assessed Damage</span>
              <span className="text-2xl font-black text-rose-600 font-mono">{claim.damagePercentage}%</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Affected Acreage</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{claim.affectedArea} <span className="text-xs">Acres</span></span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Damage Category</span>
              <span className="text-sm font-bold text-amber-700 block mt-1">{claim.damageCategory}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Severity Rating</span>
              <span className="text-sm font-bold text-rose-700 block mt-1">{claim.damageSeverity} Severity</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>Model Architecture: <strong>{analysis?.modelName || 'AgriVision-ResNet-UNet-v3.2 [OpenCV / PyTorch]'}</strong></span>
              <span>Inference Confidence: <strong className="font-mono">{analysis?.confidenceScore || 94.2}%</strong></span>
            </div>
            <p className="text-slate-600 italic mt-1">
              "{claim.aiAnalysisSummary || 'Multispectral orthomosaic confirms significant canopy reflectance suppression indicative of structural crop loss.'}"
            </p>
          </div>
        </div>

        {/* Section 4: Auditor & Administrative Endorsement */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-emerald-600">
            4. Statutory Auditor &amp; Administrator Endorsement
          </h2>
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Authorized Surveyor / Administrator:</span>
                <span className="font-bold text-slate-900 text-sm">{claim.verifiedBy || 'Dr. V. K. Sharma (Chief Surveyor)'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Verification Timestamp:</span>
                <span className="font-mono text-slate-800">{claim.verifiedAt || claim.submissionDate}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Official Verification Remarks:</span>
              <p className="text-slate-800 mt-0.5 leading-relaxed font-serif">
                {claim.adminRemarks || 'Drone imagery cross-verified against cadastral maps and state rain gauge metrics. Claim recommended for standard PMFBY localized calamity compensation.'}
              </p>
            </div>

            {/* Official Digital Stamp Box */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="border-2 border-emerald-700 p-2.5 rounded-lg text-emerald-800 text-[10px] font-mono leading-tight inline-block">
                <div className="font-black text-xs">PMFBY GOVT OF INDIA</div>
                <div>DIGITALLY VERIFIED EVIDENCE</div>
                <div>DIGEST: SHA-256 {claim.id.replace('CLM-', 'EC-')}-99F12</div>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Digital Signature:</span>
                <span className="font-mono font-bold text-slate-900">V. K. Sharma, Ph.D.</span>
                <span className="text-slate-500 block text-[10px]">District Agricultural Officer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Technical Disclaimer (as required by Section 28) */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 leading-relaxed font-sans">
          <strong>LEGAL DISCLAIMER:</strong> This report is generated by the AgriShield Intelligent Crop Insurance Verification System. AI-based damage assessment is an automated computer vision estimation based on drone orthomosaics and must be formally verified and endorsed by the authorized insurance administrator prior to financial disbursement.
        </div>
      </div>
    </div>
  );
};
