import React from 'react';
import { useBio } from '../context/BioContext';
import { DashboardTab } from '../types/bio';
import {
  Home,
  Search,
  Dna,
  Binary,
  Microscope,
  ArrowRightLeft,
  GitCompare,
  GitBranch,
  FileCode2,
  BrainCircuit,
  Globe,
  BarChart3,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '1. Home', icon: Home },
  { id: 'search', label: '2. Sequence Search', icon: Search },
  { id: 'dna-analysis', label: '3. DNA Analysis', icon: Dna },
  { id: 'orf-analysis', label: '4. ORF Analysis', icon: Microscope },
  { id: 'translation', label: '5. DNA-to-Protein Translation', icon: ArrowRightLeft },
  { id: 'protein-analysis', label: '6. Protein Analysis', icon: Binary },
  { id: 'motif-search', label: '7. Motif Search', icon: Search },
  { id: 'alignment', label: '8. Sequence Alignment', icon: GitCompare },
  { id: 'mutation', label: '9. Mutation Analysis', icon: GitBranch },
  { id: 'vcf', label: '10. VCF Generator', icon: FileCode2 },
  { id: 'machine-learning', label: '11. Machine Learning Analysis', icon: BrainCircuit },
  { id: 'population-map', label: '12. Population Map', icon: Globe },
  { id: 'visualization', label: '13. Visualization', icon: BarChart3 },
  { id: 'reports', label: '14. Reports', icon: FileText },
  { id: 'architecture-docs', label: '15. Architecture and Documentation', icon: BookOpen },
  { id: 'settings', label: '16. Settings / Theme', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, logout, activeSequence } = useBio();

  return (
    <aside className="w-72 bg-[#FFF9F7] border-r border-[#E8BFCB] flex flex-col h-screen select-none shrink-0 text-[#49343D]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E8BFCB] flex items-center space-x-3 bg-white">
        <div className="w-10 h-10 rounded-xl bg-[#F8E1E7] border border-[#E8BFCB] flex items-center justify-center text-[#D4AF72] shrink-0 shadow-sm">
          <Dna className="w-5 h-5 text-[#D4AF72]" />
        </div>
        <div className="overflow-hidden min-w-0">
          <h2 className="text-sm font-bold text-[#49343D] tracking-tight leading-tight truncate">
            Bioinformatics Analysis Suite
          </h2>
          <p className="text-[11px] text-[#49343D]/70 truncate font-medium">BAS &bull; Sequence Platform</p>
        </div>
      </div>

      {/* User Information Display Strip */}
      <div className="p-3 mx-3 mt-3 bg-white rounded-xl border border-[#E8BFCB] shadow-sm flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-[#F8E1E7] border border-[#E8BFCB] flex items-center justify-center text-[#49343D] font-mono font-bold text-xs shrink-0">
          {currentUser?.userId ? currentUser.userId.slice(-3) : '001'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#49343D] truncate">
              {currentUser?.username || 'User'}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#D4AF72]">
              {currentUser?.userId || 'BIO001'}
            </span>
          </div>
          <div className="text-[11px] text-[#49343D]/70 truncate flex items-center space-x-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Session Active</span>
          </div>
        </div>
      </div>

      {/* Active Sequence Banner */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="px-2.5 py-1.5 bg-white rounded-lg border border-[#E8BFCB] text-[11px] flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF72] shrink-0" />
            <span className="text-[#49343D] font-medium truncate">
              {activeSequence ? activeSequence.name : 'No Sequence'}
            </span>
          </div>
          {activeSequence && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F8E1E7] text-[#49343D] rounded border border-[#E8BFCB] font-semibold shrink-0">
              {activeSequence.type}
            </span>
          )}
        </div>
      </div>

      {/* Persistent Scrollable Navigation Menu */}
      <nav
        aria-label="Modules Navigation"
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-[#E8BFCB] scrollbar-track-transparent"
      >
        <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#49343D]/60">
          Analysis Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Support alias matching for orf-analysis / orf-motif
          const isActive =
            activeTab === item.id ||
            (item.id === 'orf-analysis' && activeTab === 'orf-motif');

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-colors group text-left ${
                isActive
                  ? 'bg-[#F8E1E7] text-[#49343D] font-bold border border-[#E8BFCB] shadow-xs'
                  : 'text-[#49343D] hover:bg-white hover:text-[#49343D]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#D4AF72]' : 'text-[#49343D]/60 group-hover:text-[#D4AF72]'
                }`}
              />
              <span className="truncate leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-3 border-t border-[#E8BFCB] bg-white">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-[#49343D] hover:bg-[#F8E1E7] border border-[#E8BFCB] rounded-xl transition shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-[#D4AF72]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
