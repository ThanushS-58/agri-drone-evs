import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Search, 
  FileText, 
  Eye, 
  UserCheck, 
  Calendar, 
  Layers, 
  FileCheck,
  MapPin
} from 'lucide-react';
import { InsuranceClaim, Farmer, AgriculturalField, ClaimVerificationRecord } from '../types';

interface ClaimManagementProps {
  claims: InsuranceClaim[];
  farmers: Farmer[];
  fields: AgriculturalField[];
  onUpdateClaim: (claim: InsuranceClaim) => void;
  onAddVerification: (record: ClaimVerificationRecord) => void;
  onViewReport: (claim: InsuranceClaim) => void;
  onViewClaimOnMap?: (claim: InsuranceClaim) => void;
}

export const ClaimManagement: React.FC<ClaimManagementProps> = ({
  claims,
  farmers,
  fields,
  onUpdateClaim,
  onAddVerification,
  onViewReport,
  onViewClaimOnMap,
}) => {

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingClaim, setReviewingClaim] = useState<InsuranceClaim | null>(null);
  
  // Admin verification form states
  const [adminDecision, setAdminDecision] = useState<'Approved' | 'Rejected' | 'More Information Required'>('Approved');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [adminName, setAdminName] = useState('Er. V. K. Sharma (District Agricultural Surveyor)');

  const filteredClaims = claims.filter((c) => {
    const matchesFilter = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.submittedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.submittedByEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cropType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenReview = (claim: InsuranceClaim) => {
    setReviewingClaim(claim);
    setAdminRemarks(claim.adminRemarks || 'Verified against multispectral ortho-mosaic and cadastral boundary.');
    setAdminDecision('Approved');
  };

  const handleSaveVerification = () => {
    if (!reviewingClaim) return;

    const verificationRecord: ClaimVerificationRecord = {
      id: `VER-${Date.now().toString(36).toUpperCase()}`,
      claimId: reviewingClaim.id,
      adminId: 'ADM-9021',
      adminName,
      decision: adminDecision,
      remarks: adminRemarks,
      verificationDate: new Date().toISOString().split('T')[0],
      officialSealId: `SEAL-GOV-PMFBY-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onAddVerification(verificationRecord);

    const updated: InsuranceClaim = {
      ...reviewingClaim,
      status: adminDecision,
      adminRemarks,
      verifiedBy: adminName,
      verifiedAt: new Date().toISOString().split('T')[0],
    };

    onUpdateClaim(updated);
    setReviewingClaim(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Crop Insurance Claims Verification Hub
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {claims.length} Registered Claims
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end evidence review, loss verification audits, and PMFBY statutory claim endorsements.
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search claim, farmer, policy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-56 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
            {['ALL', 'Submitted', 'Under Review', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  filterStatus === status ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Claim ID</th>
                <th className="p-4">Farmer &amp; Field</th>
                <th className="p-4">Policy Number</th>
                <th className="p-4">Damage Loss Assessment</th>
                <th className="p-4">Severity &amp; Cause</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <span className="font-bold text-white text-sm block font-mono">{claim.id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Date: {claim.submissionDate}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{claim.farmerName}</div>
                    {claim.submittedByName && (
                      <div className="text-slate-500 text-[10px]">Submitted by {claim.submittedByName}</div>
                    )}
                    <div className="text-slate-400 text-[11px]">
                      {claim.fieldId} • {claim.cropType} ({claim.fieldArea} ac)
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-300 text-[11px]">
                    {claim.policyNumber}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-rose-400 font-mono">
                        {claim.damagePercentage}%
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({claim.affectedArea} of {claim.fieldArea} acres)
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        claim.damageSeverity === 'High'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : claim.damageSeverity === 'Moderate'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {claim.damageSeverity} Severity
                      </span>
                      <span className="text-slate-300 font-medium">{claim.damageCategory}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      claim.status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : claim.status === 'Rejected'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : claim.status === 'Under Review'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {claim.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {claim.status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-400" />}
                      {claim.status === 'Under Review' && <Clock className="w-3 h-3 text-blue-400" />}
                      <span>{claim.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onViewClaimOnMap && (
                        <button
                          onClick={() => onViewClaimOnMap(claim)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs transition border border-emerald-500/20 font-medium"
                          title="View Claim Field on Google Map"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>View Claim Field</span>
                        </button>
                      )}

                      <button
                        onClick={() => onViewReport(claim)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1 text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Report</span>
                      </button>

                      <button
                        onClick={() => handleOpenReview(claim)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 text-xs shadow transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Admin Verify</span>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administrator Verification Dialog Modal (Section 17) */}
      {reviewingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Surveyor &amp; Admin Verification Portal</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {reviewingClaim.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    PMFBY Statutory Inspection &amp; Evidence Audit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingClaim(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Evidence Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div>
                <span className="text-slate-400 block text-[11px]">Farmer Claimant</span>
                <span className="font-bold text-white text-sm">{reviewingClaim.farmerName}</span>
                <span className="text-slate-400 text-[11px] block">{reviewingClaim.farmerId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Field &amp; Crop</span>
                <span className="font-bold text-white text-sm">{reviewingClaim.fieldId} ({reviewingClaim.cropType})</span>
                <span className="text-slate-400 text-[11px] block">Total Plot: {reviewingClaim.fieldArea} Acres</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assessed Damage Loss</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  {reviewingClaim.damagePercentage}% ({reviewingClaim.affectedArea} Acres)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Calamity Cause</span>
                <span className="font-semibold text-amber-300">{reviewingClaim.damageCategory}</span>
                <span className="text-slate-400 text-[11px] block">{reviewingClaim.damageSeverity} Severity</span>
              </div>
            </div>

            {/* AI Summary Readout */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <span className="text-emerald-400 font-bold block mb-1">AI Diagnostic Summary:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {reviewingClaim.aiAnalysisSummary || 'Multispectral drone orthomosaic confirms significant canopy reflectance suppression indicative of structural crop loss.'}
              </p>
            </div>

            {/* Admin Decision Selection */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-2">Administrator Endorsement Decision *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminDecision('Approved')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      adminDecision === 'Approved'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 ring-2 ring-emerald-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Claim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminDecision('Rejected')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      adminDecision === 'Rejected'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 ring-2 ring-rose-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Claim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminDecision('More Information Required')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      adminDecision === 'More Information Required'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-950 ring-2 ring-amber-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Need More Info</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Authorised Surveyor Name &amp; Designation *</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Verification Remarks &amp; Ground Grounding Notes *</label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter official surveyor verification notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingClaim(null)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVerification}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950"
              >
                Sign &amp; Seal Verification Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
