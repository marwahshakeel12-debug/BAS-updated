import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BiologicalSequence,
  UserRecord,
  DashboardTab,
  DnaAnalysisResult,
  ProteinAnalysisResult,
  OrfResult,
  MotifResult,
  AlignmentResult,
  MutationVariant,
  MLMetrics,
  MLPredictionResult,
  ThemeMode,
} from '../types/bio';
import { getUsers, loginUser, registerUser } from '../utils/authStorage';
import {
  analyzeDna,
  analyzeProtein,
  validateDnaSequence,
  validateProteinSequence,
} from '../utils/bioAlgorithms';
import {
  findOpenReadingFrames,
  findMotifs,
  translateDna,
} from '../utils/orfAndTranslation';
import { alignSequences } from '../utils/alignmentEngine';
import { detectMutations } from '../utils/mutationDetector';
import { generateVcfContent } from '../utils/vcfBuilder';
import {
  RandomForestDnaClassifier,
  defaultMlClassifier,
} from '../utils/mlEngine';
import { CURATED_DATABASE_RECORDS } from '../utils/ncbiService';

interface BioContextType {
  currentUser: UserRecord | null;
  activeTab: DashboardTab;
  activeSequence: BiologicalSequence | null;
  dnaAnalysis: DnaAnalysisResult | null;
  proteinAnalysis: ProteinAnalysisResult | null;
  orfs: OrfResult[];
  selectedOrf: OrfResult | null;
  motifQuery: string;
  motifResult: MotifResult | null;
  translatedProtein: string;
  alignmentResult: AlignmentResult | null;
  mutationVariants: MutationVariant[];
  vcfContent: string;
  mlModel: RandomForestDnaClassifier;
  mlMetrics: MLMetrics | null;
  mlPrediction: MLPredictionResult | null;
  theme: ThemeMode;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Actions
  login: (username: string, pass: string) => Promise<{ success: boolean; message: string }>;
  signup: (username: string, pass: string, confirm: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  quickDemoLogin: () => void;
  setActiveTab: (tab: DashboardTab) => void;
  setActiveSequence: (seq: BiologicalSequence) => void;
  setSelectedOrf: (orf: OrfResult | null) => void;
  searchMotif: (motif: string) => void;
  runPairwiseAlignment: (
    querySeq: string,
    type?: 'DNA' | 'PROTEIN',
    queryName?: string
  ) => void;
  generateVcf: (chrom?: string) => string;
  trainMl: () => void;
  predictSequenceMl: (dna: string) => MLPredictionResult;
  setTheme: (mode: ThemeMode) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const BioContext = createContext<BioContextType | undefined>(undefined);

export const BioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user (default to null so Welcome screen is accessible, but user can 1-click login)
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(() => {
    const saved = localStorage.getItem('bio_active_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('bio_theme_preference') as ThemeMode) || 'blush-gold';
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active Sequence (Default to curated BRCA1 so the platform is immediately full of real data)
  const [activeSequence, setActiveSequenceState] = useState<BiologicalSequence | null>(
    CURATED_DATABASE_RECORDS[0]
  );

  // Analysis states
  const [dnaAnalysis, setDnaAnalysis] = useState<DnaAnalysisResult | null>(null);
  const [proteinAnalysis, setProteinAnalysis] = useState<ProteinAnalysisResult | null>(null);
  const [orfs, setOrfs] = useState<OrfResult[]>([]);
  const [selectedOrf, setSelectedOrfState] = useState<OrfResult | null>(null);
  const [motifQuery, setMotifQuery] = useState<string>('ATG');
  const [motifResult, setMotifResult] = useState<MotifResult | null>(null);
  const [translatedProtein, setTranslatedProtein] = useState<string>('');

  // Alignment & Mutations
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResult | null>(null);
  const [mutationVariants, setMutationVariants] = useState<MutationVariant[]>([]);
  const [vcfContent, setVcfContent] = useState<string>('');

  // Machine Learning
  const [mlModel] = useState<RandomForestDnaClassifier>(defaultMlClassifier);
  const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MLPredictionResult | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('bio_theme_preference', mode);
  };

  // Re-run pipeline when active sequence changes
  const processSequence = (seq: BiologicalSequence) => {
    if (seq.type === 'DNA') {
      const dAnalysis = analyzeDna(seq.sequence);
      setDnaAnalysis(dAnalysis);

      // Find ORFs
      const foundOrfs = findOpenReadingFrames(seq.sequence, 30);
      setOrfs(foundOrfs);
      const longest = foundOrfs.length > 0 ? foundOrfs[0] : null;
      setSelectedOrfState(longest);

      // Translate full sequence and longest ORF
      const trans = translateDna(seq.sequence, 0, false);
      setTranslatedProtein(longest ? longest.translatedProtein : trans.protein);

      // Also compute protein analysis on the translated product
      const protSeq = longest ? longest.translatedProtein : trans.protein;
      if (protSeq.length > 0) {
        setProteinAnalysis(analyzeProtein(protSeq));
      }

      // Initial motif search
      const mResult = findMotifs(seq.sequence, 'ATG');
      setMotifResult(mResult);

      // Auto-generate realistic query sequence with a single point mutation and deletion for demo alignment
      const queryMutant = createRealisticVariantSequence(seq.sequence);
      const align = alignSequences(
        seq.sequence,
        queryMutant,
        'DNA',
        `${seq.name} (Wild Type)`,
        `${seq.name} (Patient Sample / Variant)`
      );
      setAlignmentResult(align);

      const detected = detectMutations(align);
      setMutationVariants(detected);

      const vcf = generateVcfContent(detected, {
        chrom: 'chr17',
        referenceName: seq.accession,
        source: 'IntegratedBioinformaticsAnalysisSoftware_v1.0',
      });
      setVcfContent(vcf);

      // ML prediction on the sequence
      const pred = mlModel.predict(seq.sequence);
      setMlPrediction(pred);
    } else {
      // Sequence is Protein
      const pAnalysis = analyzeProtein(seq.sequence);
      setProteinAnalysis(pAnalysis);
      setDnaAnalysis(null);
      setOrfs([]);
      setSelectedOrfState(null);
      setTranslatedProtein(seq.sequence);

      // Protein alignment with simulated homolog
      const queryProt = createSimulatedProteinVariant(seq.sequence);
      const align = alignSequences(
        seq.sequence,
        queryProt,
        'PROTEIN',
        `${seq.name} (Reference)`,
        `${seq.name} (Homolog Query)`
      );
      setAlignmentResult(align);

      const detected = detectMutations(align);
      setMutationVariants(detected);

      const vcf = generateVcfContent(detected, {
        chrom: 'chr17',
        referenceName: seq.accession,
      });
      setVcfContent(vcf);
    }
  };

  // Helper to create realistic biological variant sequence for demonstration
  function createRealisticVariantSequence(dna: string): string {
    const chars = dna.split('');
    // Insert a known pathogenic missense substitution at position 20 (e.g. C -> T)
    if (chars.length > 20) {
      chars[19] = chars[19] === 'A' ? 'G' : chars[19] === 'C' ? 'T' : 'A';
    }
    // Insert another substitution at position 50 (e.g. G -> A)
    if (chars.length > 50) {
      chars[49] = chars[49] === 'G' ? 'A' : 'T';
    }
    // Single in-frame deletion at position 80-82
    if (chars.length > 85) {
      chars.splice(79, 3);
    }
    return chars.join('');
  }

  function createSimulatedProteinVariant(prot: string): string {
    const chars = prot.split('');
    if (chars.length > 15) {
      chars[14] = chars[14] === 'L' ? 'P' : 'R';
    }
    if (chars.length > 40) {
      chars[39] = chars[39] === 'R' ? 'H' : 'K';
    }
    return chars.join('');
  }

  // Initial calculation on mount
  useEffect(() => {
    if (activeSequence) {
      processSequence(activeSequence);
    }
    // Pre-train ML model with real promoter/non-promoter dataset
    const metrics = mlModel.train();
    setMlMetrics(metrics);
  }, []);

  const setActiveSequence = (seq: BiologicalSequence) => {
    setActiveSequenceState(seq);
    processSequence(seq);
    showToast(`Loaded "${seq.name}" (${seq.accession}) into shared application state!`, 'success');
  };

  const setSelectedOrf = (orf: OrfResult | null) => {
    setSelectedOrfState(orf);
    if (orf) {
      setTranslatedProtein(orf.translatedProtein);
      setProteinAnalysis(analyzeProtein(orf.translatedProtein));
      showToast(`Selected ORF #${orf.id} (${orf.frame}, length: ${orf.length} bp)`, 'info');
    }
  };

  const searchMotif = (motif: string) => {
    setMotifQuery(motif);
    if (!activeSequence) return;
    const res = findMotifs(activeSequence.sequence, motif);
    setMotifResult(res);
    showToast(`Found ${res.totalOccurrences} occurrences of motif "${motif.toUpperCase()}".`, 'info');
  };

  const runPairwiseAlignment = (
    querySeq: string,
    type: 'DNA' | 'PROTEIN' = 'DNA',
    queryName: string = 'Query Sequence'
  ) => {
    if (!activeSequence) return;
    const align = alignSequences(
      activeSequence.sequence,
      querySeq,
      type,
      `${activeSequence.name} (${activeSequence.accession})`,
      queryName
    );
    setAlignmentResult(align);

    const detected = detectMutations(align);
    setMutationVariants(detected);

    const vcf = generateVcfContent(detected, {
      chrom: 'chr17',
      referenceName: activeSequence.accession,
    });
    setVcfContent(vcf);

    showToast(
      `Alignment computed! Identity: ${align.identityPercentage}%, Score: ${align.score}, ${detected.length} variants detected.`,
      'success'
    );
  };

  const generateVcf = (chrom: string = 'chr17'): string => {
    if (!mutationVariants.length && alignmentResult) {
      const vars = detectMutations(alignmentResult);
      setMutationVariants(vars);
    }
    const vcf = generateVcfContent(mutationVariants, {
      chrom,
      referenceName: activeSequence?.accession || 'UnknownRef',
    });
    setVcfContent(vcf);
    showToast(`VCF v4.2 generated with ${mutationVariants.length} variant records.`, 'success');
    return vcf;
  };

  const trainMl = () => {
    const metrics = mlModel.train();
    setMlMetrics(metrics);
    if (activeSequence && activeSequence.type === 'DNA') {
      const pred = mlModel.predict(activeSequence.sequence);
      setMlPrediction(pred);
    }
    showToast(`Random Forest model trained! Test Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`, 'success');
  };

  const predictSequenceMl = (dna: string): MLPredictionResult => {
    const pred = mlModel.predict(dna);
    setMlPrediction(pred);
    return pred;
  };

  const login = async (username: string, pass: string) => {
    const res = await loginUser(username, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('bio_active_session_user', JSON.stringify(res.user));
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    return { success: res.success, message: res.message };
  };

  const signup = async (username: string, pass: string, confirm: string) => {
    const res = await registerUser(username, pass, confirm);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('bio_active_session_user', JSON.stringify(res.user));
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    return { success: res.success, message: res.message };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bio_active_session_user');
    showToast('Logged out successfully.', 'info');
  };

  const quickDemoLogin = () => {
    const users = getUsers();
    const demo = users[0] || {
      userId: 'BIO001',
      username: 'admin',
      passwordHash: '',
      registrationDate: '2026-09-01 10:00:00',
    };
    setCurrentUser(demo);
    localStorage.setItem('bio_active_session_user', JSON.stringify(demo));
    showToast(`Logged in as Academic Admin (${demo.userId}).`, 'success');
  };

  return (
    <BioContext.Provider
      value={{
        currentUser,
        activeTab,
        activeSequence,
        dnaAnalysis,
        proteinAnalysis,
        orfs,
        selectedOrf,
        motifQuery,
        motifResult,
        translatedProtein,
        alignmentResult,
        mutationVariants,
        vcfContent,
        mlModel,
        mlMetrics,
        mlPrediction,
        theme,
        toast,
        login,
        signup,
        logout,
        quickDemoLogin,
        setActiveTab,
        setActiveSequence,
        setSelectedOrf,
        searchMotif,
        runPairwiseAlignment,
        generateVcf,
        trainMl,
        predictSequenceMl,
        setTheme,
        showToast,
      }}
    >
      {children}
    </BioContext.Provider>
  );
};

export function useBio(): BioContextType {
  const context = useContext(BioContext);
  if (!context) {
    throw new Error('useBio must be used within a BioProvider');
  }
  return context;
}
