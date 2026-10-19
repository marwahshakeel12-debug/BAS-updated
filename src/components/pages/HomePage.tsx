import React from 'react';
import { useBio } from '../../context/BioContext';
import {
  Dna,
  Search,
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
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DashboardTab } from '../../types/bio';

export const HomePage: React.FC = () => {
  const {
    activeSequence,
    dnaAnalysis,
    orfs,
    mutationVariants,
    mlPrediction,
    setActiveTab,
  } = useBio();

  const moduleCards: {
    id: DashboardTab;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'search',
      title: 'Sequence Search',
      description: 'Search NCBI and UniProt for DNA, genes, and proteins with FASTA export',
      icon: Search,
    },
    {
      id: 'dna-analysis',
      title: 'DNA Analysis',
      description: 'Base counts (A, T, G, C), GC/AT percentages, length, and validation',
      icon: Dna,
    },
    {
      id: 'orf-analysis',
      title: 'ORF Analysis',
      description: '6-frame open reading frame detection, start/stop codons, and peptides',
      icon: Microscope,
    },
    {
      id: 'translation',
      title: 'DNA-to-Protein Translation',
      description: 'Standard genetic code codon translation and FASTA protein export',
      icon: ArrowRightLeft,
    },
    {
      id: 'protein-analysis',
      title: 'Protein Analysis',
      description: 'Molecular weight, isoelectric point (pI), amino acid composition, GRAVY',
      icon: Binary,
    },
    {
      id: 'motif-search',
      title: 'Motif Search',
      description: 'Locate regulatory motifs and consensus patterns with IUPAC and regex',
      icon: Search,
    },
    {
      id: 'alignment',
      title: 'Sequence Alignment',
      description: 'Needleman-Wunsch global dynamic programming alignment & score metrics',
      icon: GitCompare,
    },
    {
      id: 'mutation',
      title: 'Mutation Analysis',
      description: 'Detect substitutions, transitions/transversions, indels, and codon impact',
      icon: GitBranch,
    },
    {
      id: 'vcf',
      title: 'VCF Generator',
      description: 'Generate and download standard VCF v4.2 format variant records',
      icon: FileCode2,
    },
    {
      id: 'machine-learning',
      title: 'Machine Learning Analysis',
      description: 'Random Forest promoter classification trained on real biological data',
      icon: BrainCircuit,
    },
    {
      id: 'population-map',
      title: 'Population Map',
      description: 'Global geographic allele frequencies and Hardy-Weinberg equilibrium tests',
      icon: Globe,
    },
    {
      id: 'visualization',
      title: 'Visualization',
      description: 'Scientific charts for GC skew, nucleotide frequencies, and ML matrices',
      icon: BarChart3,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Compile comprehensive biological analysis reports and export to PDF',
      icon: FileText,
    },
    {
      id: 'architecture-docs',
      title: 'Architecture & Documentation',
      description: 'Software architecture, PySide6 desktop blueprints, and API documentation',
      icon: BookOpen,
    },
    {
      id: 'settings',
      title: 'Settings / Theme',
      description: 'Customize application theme, preferences, and examine user records',
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Prominent Header Banner in Blush Pink & Champagne Gold */}
      <div className="bg-white border border-[#E8BFCB] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#F8E1E7] border border-[#E8BFCB] rounded-full text-xs font-semibold text-[#49343D] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D4AF72]" />
            <span>Bioinformatics Analysis Suite (BAS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#49343D] tracking-tight">
            Welcome to Bioinformatics Analysis Suite
          </h1>
          <p className="text-sm sm:text-base text-[#49343D]/80 mt-2 font-normal leading-relaxed">
            Integrated Platform for Biological Sequence Analysis.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('search')}
              className="flex items-center space-x-2 px-4 py-2 bg-[#D4AF72] hover:bg-[#c49e62] text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Databases</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FFF9F7] hover:bg-[#F8E1E7] text-[#49343D] font-semibold text-xs rounded-xl border border-[#E8BFCB] transition"
            >
              <FileText className="w-3.5 h-3.5 text-[#D4AF72]" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Sequence Telemetry Strip */}
      {activeSequence ? (
        <div className="bg-white border border-[#E8BFCB] rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8BFCB]/60 gap-3">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold text-[#D4AF72]">
                  {activeSequence.accession}
                </span>
                <span className="text-[#E8BFCB]">&bull;</span>
                <h2 className="text-base font-bold text-[#49343D]">{activeSequence.name}</h2>
                <span className="text-xs text-[#49343D]/70">({activeSequence.organism})</span>
              </div>
              <p className="text-xs text-[#49343D]/70 mt-1 line-clamp-1">{activeSequence.description}</p>
            </div>

            <button
              onClick={() => setActiveTab('search')}
              className="text-xs font-semibold text-[#D4AF72] hover:text-[#c49e62] transition shrink-0"
            >
              Change Sequence &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#E8BFCB]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#49343D]/60">Length</div>
              <div className="text-lg font-mono font-bold text-[#49343D] mt-1 tabular-nums">
                {activeSequence.length}{' '}
                <span className="text-xs font-normal text-[#49343D]/60">{activeSequence.type === 'DNA' ? 'bp' : 'aa'}</span>
              </div>
            </div>

            <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#E8BFCB]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#49343D]/60">Type</div>
              <div className="text-lg font-mono font-bold text-[#D4AF72] mt-1">{activeSequence.type}</div>
            </div>

            <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#E8BFCB]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#49343D]/60">GC Content</div>
              <div className="text-lg font-mono font-bold text-[#49343D] mt-1 tabular-nums">
                {dnaAnalysis ? `${dnaAnalysis.gcPercent}%` : 'N/A'}
              </div>
            </div>

            <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#E8BFCB]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#49343D]/60">ORFs Detected</div>
              <div className="text-lg font-mono font-bold text-[#49343D] mt-1 tabular-nums">
                {orfs.length} <span className="text-xs font-normal text-[#49343D]/60">frames</span>
              </div>
            </div>

            <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#E8BFCB]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#49343D]/60">Mutations</div>
              <div className="text-lg font-mono font-bold text-[#49343D] mt-1 tabular-nums">
                {mutationVariants.length} <span className="text-xs font-normal text-[#49343D]/60">variants</span>
              </div>
            </div>

            <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#E8BFCB]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#49343D]/60">ML Prediction</div>
              <div className="text-lg font-mono font-bold text-[#D4AF72] mt-1 truncate">
                {mlPrediction ? mlPrediction.classification : 'Classified'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Analysis Modules Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#49343D]/70">
            Analysis Suite Modules
          </h2>
          <span className="text-xs text-[#49343D]/60">
            Select any module to execute analyses
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {moduleCards.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-start space-x-3.5 p-4 rounded-xl bg-white border border-[#E8BFCB] hover:border-[#D4AF72] hover:bg-[#F8E1E7]/30 transition text-left group shadow-xs"
              >
                <div className="p-2.5 rounded-lg bg-[#F8E1E7] text-[#D4AF72] group-hover:bg-[#D4AF72] group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#49343D] group-hover:text-[#49343D] transition-colors">
                      {item.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E8BFCB] group-hover:text-[#D4AF72] transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-xs text-[#49343D]/70 mt-1 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
