import React, { useState } from 'react';
import { useBio } from '../../context/BioContext';
import { BiologicalSequence, SequenceType } from '../../types/bio';
import {
  searchBiologicalDatabase,
  CURATED_DATABASE_RECORDS,
  downloadFastaFile,
  formatFasta,
} from '../../utils/ncbiService';
import { parseFasta, validateDnaSequence, validateProteinSequence } from '../../utils/bioAlgorithms';
import {
  Search,
  Database,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  Filter,
  Loader2,
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { activeSequence, setActiveSequence, showToast } = useBio();

  // Search form
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DNA' | 'PROTEIN'>('ALL');
  const [searchResults, setSearchResults] = useState<BiologicalSequence[]>(CURATED_DATABASE_RECORDS);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // FASTA viewer modal
  const [viewingFastaSeq, setViewingFastaSeq] = useState<BiologicalSequence | null>(null);

  // File upload state
  const [fileError, setFileError] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');
  const [uploadedRecord, setUploadedRecord] = useState<BiologicalSequence | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim();
    setSearchError(null);

    if (!query) {
      setSearchResults(
        CURATED_DATABASE_RECORDS.filter(r => (filterType === 'ALL' ? true : r.type === filterType))
      );
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const results = await searchBiologicalDatabase(query, filterType);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(`No biological records found matching "${query}". Please check the gene symbol, accession, or identifier.`);
      } else {
        showToast(`Found ${results.length} record(s) matching "${query}".`, 'success');
      }
    } catch (err: any) {
      setSearchError('Public database query was unavailable or returned an error. Please try again.');
      showToast('Database query encountered an issue.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectExample = (seq: BiologicalSequence) => {
    setSearchTerm(seq.name);
    setSearchResults([seq]);
    setHasSearched(true);
    setSearchError(null);
  };

  // Optional FASTA file upload validator (.fasta, .fa, .fna)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    setFileSuccess('');
    setUploadedRecord(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const validExtensions = ['.fasta', '.fa', '.fna'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExt) {
      setFileError('Invalid file format. Allowed extensions: .fasta, .fa, .fna');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) {
        setFileError('The uploaded FASTA file is empty.');
        return;
      }

      const parsed = parseFasta(text);
      if (!parsed.sequence) {
        setFileError('Could not parse any valid sequence lines from the FASTA file.');
        return;
      }

      // Check whether it is DNA or Protein
      const dnaCheck = validateDnaSequence(parsed.sequence);
      const isDna = dnaCheck.isValid;
      const protCheck = validateProteinSequence(parsed.sequence);

      if (!isDna && !protCheck.isValid) {
        setFileError('Sequence rejected: detected invalid characters that are neither standard DNA nucleotides nor amino acids.');
        return;
      }

      const seqType: SequenceType = isDna ? 'DNA' : 'PROTEIN';
      const cleanSequence = isDna ? dnaCheck.cleanSeq : protCheck.cleanSeq;

      const newRecord: BiologicalSequence = {
        id: `UPLOAD_${Date.now()}`,
        name: parsed.header.split(' ')[0] || file.name.replace(/\.[^/.]+$/, ''),
        accession: 'LOCAL_UPLOAD',
        organism: 'User-Supplied',
        description: parsed.header || file.name,
        type: seqType,
        sequence: cleanSequence,
        length: cleanSequence.length,
        source: 'FILE_UPLOAD',
        fastaHeader: parsed.header,
      };

      setUploadedRecord(newRecord);
      setFileSuccess(`Validated ${seqType} FASTA file: ${file.name} (${newRecord.length} ${seqType === 'DNA' ? 'bp' : 'aa'}). Click [USE SEQUENCE] to load into suite.`);
    };

    reader.onerror = () => {
      setFileError('Failed to read local file.');
    };

    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Description Card */}
      <div className="bg-white border border-[#E8BFCB] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#49343D] tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-[#D4AF72]" />
              Biological Database Search & Retrieval
            </h2>
            <p className="text-xs text-[#49343D]/70 mt-1 max-w-2xl leading-relaxed">
              Query biological records across public databases (NCBI Entrez and UniProtKB).
              When you select <strong className="text-[#49343D] font-bold">[USE SEQUENCE]</strong>, 
              the sequence is automatically synchronized across all suite modules without manual re-entry.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F8E1E7] text-[#49343D] border border-[#E8BFCB]">
              NCBI &bull; UniProtKB Integrated
            </span>
          </div>
        </div>

        {/* Quick Example Identifiers */}
        <div className="mt-4 pt-4 border-t border-[#E8BFCB]/50">
          <div className="text-[11px] font-bold text-[#49343D]/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF72]" />
            Quick Example Identifiers:
          </div>
          <div className="flex flex-wrap gap-2">
            {CURATED_DATABASE_RECORDS.map(rec => (
              <button
                key={rec.id}
                onClick={() => handleSelectExample(rec)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  activeSequence?.accession === rec.accession
                    ? 'bg-[#D4AF72] text-white border-[#D4AF72] font-bold shadow-xs'
                    : 'bg-[#FFF9F7] border-[#E8BFCB] text-[#49343D] hover:bg-[#F8E1E7]'
                }`}
              >
                {rec.name} <span className="text-[10px] opacity-80 font-mono">({rec.accession})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Search Bar */}
      <div className="bg-white border border-[#E8BFCB] rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#D4AF72] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search Gene (e.g. BRCA1, TP53, EGFR) or Accession (e.g. NM_007294, P04637, P01308)..."
              className="w-full bg-[#FFF9F7] border border-[#E8BFCB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#49343D] placeholder-[#49343D]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF72] transition"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-[#FFF9F7] border border-[#E8BFCB] rounded-xl px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#D4AF72] mr-2" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="bg-transparent text-[#49343D] focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL">All Types</option>
                <option value="DNA">DNA Only</option>
                <option value="PROTEIN">Protein Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-[#D4AF72] hover:bg-[#c49e62] text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
            >
              {searching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-3 p-3 bg-[#F8E1E7] border border-rose-300 rounded-xl flex items-start space-x-2 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Search Results Table */}
      <div className="bg-white border border-[#E8BFCB] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E8BFCB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#D4AF72]" />
            <h3 className="text-sm font-bold text-[#49343D]">
              Database Records ({searchResults.length})
            </h3>
          </div>
          <span className="text-xs text-[#49343D]/60">
            Click [USE SEQUENCE] to bind into active analysis session
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FFF9F7] text-[#49343D] font-semibold border-b border-[#E8BFCB]">
              <tr>
                <th className="p-3">Gene / Target</th>
                <th className="p-3">Accession</th>
                <th className="p-3">Organism</th>
                <th className="p-3">Type</th>
                <th className="p-3">Length</th>
                <th className="p-3">Source</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8BFCB]/50 text-[#49343D]">
              {searchResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#49343D]/60">
                    {hasSearched
                      ? 'No records found. Try searching by accession number or standard gene symbol.'
                      : 'Enter a query above to search public databases.'}
                  </td>
                </tr>
              ) : (
                searchResults.map(record => {
                  const isActive = activeSequence?.accession === record.accession;
                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-[#F8E1E7]/20 transition-colors ${
                        isActive ? 'bg-[#F8E1E7]/50' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-[#49343D] flex items-center gap-1.5">
                        {record.name}
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded bg-[#D4AF72]/20 text-[#49343D] text-[10px] font-semibold border border-[#D4AF72]/40">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-semibold text-[#D4AF72]">{record.accession}</td>
                      <td className="p-3 text-[#49343D]/80">{record.organism}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            record.type === 'DNA'
                              ? 'bg-[#F8E1E7] text-[#49343D] border border-[#E8BFCB]'
                              : 'bg-[#FFF9F7] text-[#D4AF72] border border-[#D4AF72]/40'
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono tabular-nums">
                        {record.length} {record.type === 'DNA' ? 'bp' : 'aa'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-[#49343D]/60 font-semibold">
                        {record.source}
                      </td>
                      <td className="p-3 text-[#49343D]/70 max-w-xs truncate" title={record.description}>
                        {record.description}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setViewingFastaSeq(record)}
                          className="px-2.5 py-1 rounded bg-[#FFF9F7] hover:bg-[#F8E1E7] text-[#49343D] text-xs font-medium border border-[#E8BFCB] transition"
                        >
                          View FASTA
                        </button>
                        <button
                          onClick={() => downloadFastaFile(record)}
                          className="px-2.5 py-1 rounded bg-[#FFF9F7] hover:bg-[#F8E1E7] text-[#49343D] text-xs font-medium border border-[#E8BFCB] transition"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => setActiveSequence(record)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition ${
                            isActive
                              ? 'bg-[#49343D] text-white cursor-default'
                              : 'bg-[#D4AF72] hover:bg-[#c49e62] text-white shadow-xs'
                          }`}
                        >
                          {isActive ? '✓ In Use' : 'Use Sequence'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary: Local FASTA File Upload */}
      <div className="bg-white border border-[#E8BFCB] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-2">
          <Upload className="w-5 h-5 text-[#D4AF72]" />
          <h3 className="text-sm font-bold text-[#49343D] uppercase tracking-wider">
            Secondary / Local FASTA Upload
          </h3>
        </div>
        <p className="text-xs text-[#49343D]/70 mb-4 leading-relaxed">
          Allowed file formats: <span className="font-mono text-[#49343D] font-semibold">.fasta, .fa, .fna</span>. 
          The parser validates biological characters and rejects corrupted or invalid sequence formats.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#FFF9F7] hover:bg-[#F8E1E7] text-[#49343D] border border-[#E8BFCB] rounded-xl cursor-pointer text-xs font-medium transition shadow-2xs">
            <Upload className="w-4 h-4 text-[#D4AF72]" />
            <span>Select Local FASTA File</span>
            <input
              type="file"
              accept=".fasta,.fa,.fna"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {uploadedRecord && (
            <button
              onClick={() => setActiveSequence(uploadedRecord)}
              className="px-4 py-2.5 bg-[#D4AF72] hover:bg-[#c49e62] text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Use Uploaded Sequence ({uploadedRecord.type})</span>
            </button>
          )}
        </div>

        {fileError && (
          <div className="mt-3 p-3 bg-[#F8E1E7] border border-rose-300 rounded-xl flex items-start space-x-2 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{fileError}</span>
          </div>
        )}

        {fileSuccess && (
          <div className="mt-3 p-3 bg-[#FFF9F7] border border-emerald-300 rounded-xl flex items-start space-x-2 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{fileSuccess}</span>
          </div>
        )}
      </div>

      {/* FASTA Modal */}
      {viewingFastaSeq && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8BFCB] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#E8BFCB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#49343D]">
                  FASTA Sequence: {viewingFastaSeq.name} ({viewingFastaSeq.accession})
                </h3>
                <p className="text-xs text-[#49343D]/70">
                  {viewingFastaSeq.organism} &bull; {viewingFastaSeq.length} {viewingFastaSeq.type === 'DNA' ? 'bp' : 'aa'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(formatFasta(viewingFastaSeq))}
                  className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-[#F8E1E7] text-[#49343D] text-xs font-medium rounded-lg border border-[#E8BFCB] flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-[#D4AF72]" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => downloadFastaFile(viewingFastaSeq)}
                  className="px-3 py-1.5 bg-[#D4AF72] hover:bg-[#c49e62] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setViewingFastaSeq(null)}
                  className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-[#F8E1E7] text-[#49343D] text-xs font-medium rounded-lg border border-[#E8BFCB]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5 overflow-auto flex-1 font-mono text-xs">
              <pre className="bg-[#FFF9F7] p-4 rounded-xl border border-[#E8BFCB] text-[#49343D] whitespace-pre-wrap break-all leading-relaxed">
                {formatFasta(viewingFastaSeq)}
              </pre>
            </div>

            <div className="p-4 border-t border-[#E8BFCB] flex justify-end">
              <button
                onClick={() => {
                  setActiveSequence(viewingFastaSeq);
                  setViewingFastaSeq(null);
                }}
                className="px-4 py-2 bg-[#D4AF72] hover:bg-[#c49e62] text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Use Sequence in Active Session &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
