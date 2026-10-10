import React from 'react';
import { 
  Plane, 
  Users, 
  MapPin, 
  Map as MapIcon,
  Activity, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  LogIn,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { AgriculturalField } from '../types';
import { useAuth } from '../context/AuthContext';

export type NavTab = 
  | 'dashboard' 
  | 'farmers' 
  | 'fields' 
  | 'map'
  | 'drone' 
  | 'analysis' 
  | 'claims' 
  | 'graphs' 
  | 'reports';

interface NavigationProps {
  currentTab: NavTab;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectTab: (tab: NavTab) => void;
  fields: AgriculturalField[];
  selectedFieldId: string;
  onSelectField: (fieldId: string) => void;
  onResetDemo: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  theme,
  onToggleTheme,
  onSelectTab,
  fields,
  selectedFieldId,
  onSelectField,
  onResetDemo,
}) => {
  const { user, isAdmin, openAuthModal, signInWithGoogle, signOutUser } = useAuth();
  const currentField = fields.find((f) => f.id === selectedFieldId);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
    { id: 'farmers', label: 'Farmers', icon: <Users className="w-4 h-4" /> },
    { id: 'fields', label: 'Fields', icon: <MapPin className="w-4 h-4" /> },
    { id: 'map', label: 'Field Map', icon: <MapIcon className="w-4 h-4" /> },
    { id: 'drone', label: 'Drone Monitoring', icon: <Plane className="w-4 h-4" /> },
    { id: 'analysis', label: 'AI Damage Analysis', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'claims', label: 'Insurance Claims', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'graphs', label: 'Live Graphs', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports', label: 'Claim Reports', icon: <FileText className="w-4 h-4" /> },
  ];


  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md shadow-emerald-900/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 bg-clip-text text-transparent">
                  AgriShield AI
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Drone Verification
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Intelligent Crop Loss &amp; Insurance Assessment Engine
              </p>
            </div>
          </div>

          {/* Active Field & Auth Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Active Field:</span>
              <select
                value={selectedFieldId}
                onChange={(e) => onSelectField(e.target.value)}
                className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer pr-2"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-800 text-slate-200">
                    {f.id} - {f.name} ({f.cropType})
                  </option>
                ))}
              </select>
              {currentField && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  currentField.monitoringStatus === 'Critical Damage' 
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : currentField.monitoringStatus === 'Needs Review'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {currentField.monitoringStatus}
                </span>
              )}
            </div>

            {/* Google Sign-in / User Profile */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'light'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 bg-slate-800/90 pl-2 pr-1.5 py-1 rounded-xl border border-slate-700 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <div className="font-semibold text-white leading-tight truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase">
                    {isAdmin ? 'Chief Surveyor (Admin)' : 'Field Officer'}
                  </span>
                </div>
                <button
                  onClick={signOutUser}
                  title="Sign out of Firebase"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Login / Signup</span>
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-xs items-center gap-1.5 shadow-md shadow-emerald-950 transition"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            )}

            <button
              onClick={onResetDemo}
              title="Reset to Sample Demo Dataset"
              className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
