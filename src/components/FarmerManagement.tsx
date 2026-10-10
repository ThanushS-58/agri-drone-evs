import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  FileText,
  CheckCircle2,
  Download,
  Upload,
} from 'lucide-react';
import { Farmer, AgriculturalField, InsuranceClaim } from '../types';
import { parseSampleDataset, SampleDatasetRow } from '../utils/sampleDataset';

interface FarmerManagementProps {
  farmers: Farmer[];
  fields: AgriculturalField[];
  claims: InsuranceClaim[];
  onAddFarmer: (farmer: Omit<Farmer, 'id' | 'registeredDate'>) => void;
  onUpdateFarmer: (farmer: Farmer) => void;
  onDeleteFarmer: (farmerId: string) => void;
  onSelectField: (fieldId: string) => void;
  onImportDataset: (rows: SampleDatasetRow[]) => Promise<void>;
}

export const FarmerManagement: React.FC<FarmerManagementProps> = ({
  farmers,
  fields,
  claims,
  onAddFarmer,
  onUpdateFarmer,
  onDeleteFarmer,
  onSelectField,
  onImportDataset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState<Farmer | null>(null);
  const [datasetMessage, setDatasetMessage] = useState('');
  const [isImportingDataset, setIsImportingDataset] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formVillage, setFormVillage] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formState, setFormState] = useState('');
  const [formLandOwnership, setFormLandOwnership] = useState('');
  const [formPolicyNumber, setFormPolicyNumber] = useState('');

  const openAddModal = () => {
    setEditingFarmer(null);
    setFormName('');
    setFormPhone('+91 ');
    setFormEmail('');
    setFormAddress('');
    setFormVillage('');
    setFormDistrict('');
    setFormState('Punjab');
    setFormLandOwnership('Registered Land Deed (5.0 Acres)');
    setFormPolicyNumber(`PMFBY-${new Date().getFullYear()}-IN-${Math.floor(10000 + Math.random() * 90000)}`);
    setIsModalOpen(true);
  };

  const openEditModal = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFormName(farmer.name);
    setFormPhone(farmer.phone);
    setFormEmail(farmer.email);
    setFormAddress(farmer.address);
    setFormVillage(farmer.village);
    setFormDistrict(farmer.district);
    setFormState(farmer.state);
    setFormLandOwnership(farmer.landOwnership);
    setFormPolicyNumber(farmer.policyNumber);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingFarmer) {
      onUpdateFarmer({
        ...editingFarmer,
        name: formName,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        village: formVillage,
        district: formDistrict,
        state: formState,
        landOwnership: formLandOwnership,
        policyNumber: formPolicyNumber,
      });
    } else {
      onAddFarmer({
        name: formName,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        village: formVillage,
        district: formDistrict,
        state: formState,
        landOwnership: formLandOwnership,
        policyNumber: formPolicyNumber,
      });
    }

    setIsModalOpen(false);
  };

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDatasetFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setDatasetMessage('');
    setIsImportingDataset(true);
    try {
      const rows = parseSampleDataset(await file.text());
      await onImportDataset(rows);
      setDatasetMessage(`Imported ${rows.length} dataset row(s). Existing matching records were reused.`);
    } catch (error) {
      setDatasetMessage(error instanceof Error ? error.message : 'Could not import this CSV file.');
    } finally {
      setIsImportingDataset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Registered Farmers Registry
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {farmers.length} Total Registered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain government-verified farmer profiles, land entitlement records, and active crop insurance policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/sample-agri-dataset.csv"
            download
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Sample CSV
          </a>
          <label className={`px-3 py-2 rounded-xl text-xs font-semibold bg-sky-700 hover:bg-sky-600 text-white flex items-center gap-2 cursor-pointer ${isImportingDataset ? 'opacity-60 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4" />
            {isImportingDataset ? 'Importing…' : 'Import CSV'}
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleDatasetFile} disabled={isImportingDataset} />
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, village, policy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-64 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition shadow-md shadow-emerald-950"
          >
            <UserPlus className="w-4 h-4" />
            <span>REGISTER FARMER</span>
          </button>
        </div>
      </div>
      {datasetMessage && (
        <div role="status" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-200">
          {datasetMessage}
        </div>
      )}

      {/* Farmers Table / Grid */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Farmer ID &amp; Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Location (Village / State)</th>
                <th className="p-4">Land Ownership</th>
                <th className="p-4">Policy Number</th>
                <th className="p-4">Registered Fields</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFarmers.map((farmer) => {
                const farmerFields = fields.filter((f) => f.farmerId === farmer.id);
                const farmerClaims = claims.filter((c) => c.farmerId === farmer.id);

                return (
                  <tr key={farmer.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{farmer.name}</div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900">
                        {farmer.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{farmer.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{farmer.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">{farmer.village}, {farmer.district}</div>
                      <div className="text-slate-400">{farmer.state}</div>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">
                      {farmer.landOwnership}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {farmer.policyNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold text-[11px] border border-emerald-800">
                          {farmerFields.length} Fields
                        </span>
                        {farmerClaims.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-semibold text-[11px] border border-amber-800">
                            {farmerClaims.length} Claims
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFarmerDetails(farmer)}
                          title="View Farmer Profile & Fields"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(farmer)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete farmer ${farmer.name}?`)) {
                              onDeleteFarmer(farmer.id);
                            }
                          }}
                          title="Delete Record"
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition border border-rose-900/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Farmer Profile Deep-Dive Drawer / Modal */}
      {selectedFarmerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-lg font-bold">
                  {selectedFarmerDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedFarmerDetails.name}</h3>
                  <p className="text-xs font-mono text-emerald-400">{selectedFarmerDetails.id} • Registered {selectedFarmerDetails.registeredDate}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFarmerDetails(null)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                ✕ Close
              </button>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-semibold text-white">{selectedFarmerDetails.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="font-semibold text-white">{selectedFarmerDetails.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Village &amp; District</span>
                <span className="font-semibold text-white">{selectedFarmerDetails.village}, {selectedFarmerDetails.district}, {selectedFarmerDetails.state}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Insurance Policy #</span>
                <span className="font-mono font-semibold text-emerald-300">{selectedFarmerDetails.policyNumber}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-700/40">
                <span className="text-slate-400 block text-[11px]">Land Title Ownership</span>
                <span className="text-slate-200">{selectedFarmerDetails.landOwnership}</span>
              </div>
            </div>

            {/* Farmer Registered Fields */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Registered Agricultural Fields
              </h4>
              <div className="space-y-2">
                {fields.filter((f) => f.farmerId === selectedFarmerDetails.id).map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{f.name}</span>
                      <div className="text-slate-400 text-[11px]">
                        Crop: {f.cropType} ({f.cropVariety}) • {f.areaAcres} Acres • Status: {f.monitoringStatus}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectField(f.id);
                        setSelectedFarmerDetails(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow"
                    >
                      Inspect Field
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Farmer Claims */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Associated Insurance Claims
              </h4>
              <div className="space-y-2">
                {claims.filter((c) => c.farmerId === selectedFarmerDetails.id).map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Damage: {c.damagePercentage}% ({c.affectedArea} acres) • Category: {c.damageCategory}
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{c.submissionDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register / Edit Farmer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSubmitForm}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{editingFarmer ? 'Edit Farmer Details' : 'Register New Agricultural Farmer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Farmer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="kisan@gov.in"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Postal / Survey Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Survey No. 42, Canal Bund"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Land Ownership Details *</label>
                <input
                  type="text"
                  required
                  value={formLandOwnership}
                  onChange={(e) => setFormLandOwnership(e.target.value)}
                  placeholder="e.g. Freehold Title Deed (8.5 Acres)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Insurance Policy Number *</label>
                <input
                  type="text"
                  required
                  value={formPolicyNumber}
                  onChange={(e) => setFormPolicyNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
              >
                {editingFarmer ? 'Update Farmer' : 'Save & Register Farmer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
