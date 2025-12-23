import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileCode,
  Image as ImageIcon,
  File as FileIcon,
  HardDrive,
  Clock,
  Filter,
  Copy,
  ExternalLink,
  ChevronRight,
  Plus,
  Eye,
  Tag,
  Edit3,
  ArrowUpDown,
  MoreVertical,
  Layers,
  X,
  Send,
  CheckSquare,
  Square,
  BarChart3,
  Info,
  QrCode,
  Link as LinkIcon,
  Globe,
  Smartphone
} from 'lucide-react';

/**
 * Internship Project: Professional GridFS Management Dashboard (Elite Version)
 * * Update:
 * - Added inline feedback for the QR Modal Copy button: Label changes to "Copied!" on click.
 * - Robust Clipboard helper remains optimized for restricted environments.
 */

const App = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState([]); 
  
  // QR Modal State
  const [qrModal, setQrModal] = useState(null); 
  const [isQrCopied, setIsQrCopied] = useState(false); // State for inline button feedback
  
  const [pendingFile, setPendingFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const statusTimerRef = useRef(null);

  // Initial Mock Data
  useEffect(() => {
    const mockFiles = [
      {
        _id: '65c3d4e5f6g7h8i901234567',
        filename: 'api_documentation.pdf',
        contentType: 'application/pdf',
        length: 1024 * 450, 
        uploadDate: new Date(Date.now() - 600000).toISOString(),
        metadata: { originalName: 'api_documentation.pdf', tags: ['API', 'INTERNAL'] },
        preview: 'https://www.africau.edu/images/default/sample.pdf'
      },
      {
        _id: '65b2c3d4e5f6g7h8i9012345',
        filename: 'hero_background.png',
        contentType: 'image/png',
        length: 1024 * 2048,
        uploadDate: new Date(Date.now() - 3600000 * 5).toISOString(),
        metadata: { originalName: 'hero_background.png', project: 'Website Redesign', tags: ['ASSET', 'DESIGN'] },
        preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800&h=600'
      },
      {
        _id: '65a1b2c3d4e5f6g7h8i90123',
        filename: 'technical_specification_v2.pdf',
        contentType: 'application/pdf',
        length: 1024 * 1250, 
        uploadDate: '2025-12-22T12:00:00Z',
        metadata: { originalName: 'technical_specification_v2.pdf', version: '2.0', tags: ['INTERNAL', 'SPEC', 'DESIGN'] },
        preview: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ];
    setFiles(mockFiles);
  }, []);

  const getRelativeTime = (isoDate) => {
    try {
      const now = new Date();
      const then = new Date(isoDate);
      const diff = now.getTime() - then.getTime();
      if (diff < 0 || diff > 86400000) return then.toLocaleDateString('en-GB');
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return then.toLocaleDateString();
    } catch (e) { return 'Unknown'; }
  };

  const getTagStyle = (tag) => {
    const colors = [
      'bg-rose-50 text-rose-600 border-rose-100',
      'bg-indigo-50 text-indigo-600 border-indigo-100',
      'bg-emerald-50 text-emerald-600 border-emerald-100',
      'bg-amber-50 text-amber-600 border-amber-100',
      'bg-sky-50 text-sky-600 border-sky-100',
      'bg-purple-50 text-purple-600 border-purple-100'
    ];
    let hash = 0;
    const tagStr = String(tag);
    for (let i = 0; i < tagStr.length; i++) hash = tagStr.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const copyToClipboard = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      return false;
    }
  };

  const triggerQrDisplay = (file) => {
    const shareableLink = file.preview || `https://gridflow-gateway.pro/v1/share/${file._id}`;
    setQrModal({
      id: file._id,
      name: file.metadata?.originalName || file.filename,
      link: shareableLink,
      type: file.contentType
    });
    setIsQrCopied(false); // Reset feedback state
    showStatus('success', 'All-device access link generated');
  };

  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, file) => acc + file.length, 0);
    const storageLimit = 50 * 1024 * 1024;
    const percentUsed = (totalSize / storageLimit) * 100;
    return { totalSize, storageLimit, percentUsed };
  }, [files]);

  const filteredFiles = useMemo(() => {
    let result = files.filter(file => {
      const fileName = file.metadata?.originalName || '';
      const tags = file.metadata?.tags || [];
      const matchesSearch = fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            file._id.includes(searchQuery.toLowerCase()) ||
                            tags.some(t => String(t).toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterType === 'all' || 
                            (filterType === 'images' && file.contentType?.includes('image')) ||
                            (filterType === 'docs' && file.contentType?.includes('pdf'));
      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortBy === 'oldest') return new Date(a.uploadDate) - new Date(b.uploadDate);
      if (sortBy === 'size') return b.length - a.length;
      if (sortBy === 'name') return (a.metadata?.originalName || "").localeCompare(b.metadata?.originalName || "");
      return 0;
    });
  }, [files, searchQuery, filterType, sortBy]);

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFiles, currentPage]);

  const showStatus = (type, message) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatus({ type, message: String(message) });
    statusTimerRef.current = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const downloadFile = async (file) => {
    const originalName = file.metadata?.originalName || file.filename;
    showStatus('success', `Preparing download...`);
    const downloadUrl = file.preview || `/api/files/${file.filename}`;
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) { showStatus('error', 'Simulation download restricted.'); }
  };

  const handleFileSelection = (e) => {
    const selectedFile = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!selectedFile) return;
    let localPreview = null;
    if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
      localPreview = URL.createObjectURL(selectedFile);
    }
    setPendingFile({ file: selectedFile, preview: localPreview, name: selectedFile.name, size: selectedFile.size, type: selectedFile.type });
  };

  const confirmUpload = () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setTimeout(() => {
      const newFile = {
        _id: Array.from({length:24}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        filename: `${Math.random().toString(16).slice(2, 10)}_${pendingFile.name}`,
        contentType: pendingFile.type,
        length: pendingFile.size,
        uploadDate: new Date().toISOString(),
        metadata: { originalName: pendingFile.name, tags: ['HANDHELD-SYNC'] },
        preview: pendingFile.preview 
      };
      setFiles(prev => [newFile, ...prev]);
      setIsUploading(false);
      setPendingFile(null);
      showStatus('success', 'Pushed to Cloud GridFS Cluster');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg">
              <FileCode size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">File <span className="text-indigo-600 font-black italic">Uploader</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                  <HardDrive size={12} /> Live Sync Cluster
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full bg-indigo-600" style={{ width: `${stats.percentUsed}%` }} />
                  </div>
                  <span className="text-xs font-black text-slate-700">{formatSize(stats.totalSize)}</span>
                </div>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* QR MODAL */}
        {qrModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                   <Smartphone className="text-indigo-600" size={18} />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Link</span>
                </div>
                <button onClick={() => setQrModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="relative inline-block mb-8 p-8 bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-50 group">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrModal.link)}&bgcolor=ffffff&color=4f46e5&margin=10&format=svg`}
                  alt="Sync QR"
                  className="w-48 h-48 rounded-lg relative z-10 transition-transform group-hover:scale-110 duration-500"
                />
                <div className="absolute inset-0 bg-indigo-600/5 blur-xl opacity-50"></div>
              </div>

              <div className="space-y-2 mb-8 px-2">
                <h4 className="text-sm font-black text-slate-800 truncate">{qrModal.name}</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Scan this code with any mobile device to view the same 
                  <span className="text-indigo-600 font-bold uppercase"> {qrModal.type.split('/')[1]} </span> 
                  instantly.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => { 
                    const success = copyToClipboard(qrModal.link);
                    if (success) {
                      showStatus('success', 'Link copied');
                      setIsQrCopied(true);
                      setTimeout(() => setIsQrCopied(false), 2000);
                    } else {
                      showStatus('error', 'Browser blocked copy command');
                    }
                  }}
                  className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border ${
                    isQrCopied ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {isQrCopied ? <CheckCircle2 size={14} /> : <LinkIcon size={14} />}
                  {isQrCopied ? 'Copied!' : 'Copy URL'}
                </button>
                <button 
                  onClick={() => window.open(qrModal.link, '_blank')}
                  className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Globe size={14} /> Test Link
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed top-20 right-4 z-50 w-full max-w-sm pointer-events-none">
          {status.message && (
            <div className={`pointer-events-auto p-4 rounded-xl border bg-white border-slate-200 shadow-xl flex items-center justify-between animate-in slide-in-from-right-full`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                   {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <span className="text-sm font-bold tracking-tight">{status.message}</span>
              </div>
              <button onClick={() => setStatus({type:'', message:''})} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={16} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers size={16} className="text-indigo-600" /> Ingestion Node
              </h3>
              
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileSelection(e); }}
                className={`relative group border-2 border-dashed rounded-[2.5rem] min-h-[220px] flex flex-col items-center justify-center transition-all ${
                dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 bg-slate-50/30'
              }`}>
                {isUploading ? (
                  <div className="text-center animate-in fade-in">
                    <Loader2 size={40} className="animate-spin text-indigo-600 mb-4 mx-auto" />
                    <p className="text-sm font-black text-slate-700 uppercase tracking-tighter">Syncing Binary Chunks</p>
                  </div>
                ) : pendingFile ? (
                  <div className="w-full h-full p-6 flex flex-col items-center justify-center animate-in zoom-in-95">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-4 border-white mb-4 bg-white flex items-center justify-center rotate-3">
                       {pendingFile.type.includes('image') ? <img src={pendingFile.preview} alt="Upload Preview" className="w-full h-full object-cover" /> : <FileText size={32} className="text-rose-500" />}
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate w-full text-center mb-6">{pendingFile.name}</p>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => setPendingFile(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 transition-all">Discard</button>
                      <button onClick={confirmUpload} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">Publish</button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-10 group">
                    <input type="file" className="hidden" onChange={handleFileSelection} />
                    <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 tracking-tight">New Data Stream</p>
                  </label>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-2xl overflow-hidden relative">
              <div className="absolute -right-4 -top-4 opacity-[0.05] rotate-12"><BarChart3 size={120} /></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" /> Handover Strategy
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Resources can be accessed via QR Device Handover. GridFS handles the large binary streaming across all platforms.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search metadata nodes..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                {['all', 'docs', 'images'].map((t) => (
                  <button key={t} onClick={() => setFilterType(t)} className={`px-5 py-2 text-[10px] font-black rounded-xl uppercase tracking-tighter transition-all ${filterType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Node</th>
                      <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Info</th>
                      <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tags</th>
                      <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFiles.map((file) => (
                      <tr key={file._id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden shadow-sm transition-transform group-hover:scale-110 ${file.contentType?.includes('image') ? 'bg-blue-50' : 'bg-rose-50'}`}>
                              {file.preview ? <img src={file.preview} alt="Thumb" className="w-full h-full object-cover" /> : <FileText className={file.contentType?.includes('image') ? 'text-blue-500' : 'text-rose-500'} size={24} />}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold text-slate-800 truncate max-w-[180px] leading-tight mb-1">{file.metadata?.originalName || 'Untitled'}</p>
                               <div className="flex items-center gap-2">
                                  <code className="text-[10px] text-slate-400 font-mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{file._id.substring(0, 14)}...</code>
                                  <button 
                                    onClick={() => {
                                      const ok = copyToClipboard(file._id);
                                      if (ok) showStatus('success', 'BSON ID copied');
                                    }}
                                    className="text-slate-300 hover:text-indigo-600 transition-colors"
                                    title="Copy ObjectID"
                                  >
                                    <Copy size={12} />
                                  </button>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-2 text-[11px] text-slate-600 font-bold mb-1">
                              <Clock size={12} className="text-indigo-400" /> {getRelativeTime(file.uploadDate)}
                           </div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{formatSize(file.length)}</div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-wrap gap-1.5">
                            {file.metadata?.tags?.map((tag, i) => (
                              <span key={i} className={`px-2 py-1 text-[8px] font-black rounded uppercase border tracking-tighter shadow-sm transition-transform hover:scale-105 ${getTagStyle(tag)}`}>{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => triggerQrDisplay(file)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-xl transition-all" title="Device Handover"><QrCode size={20} /></button>
                            <button onClick={() => window.open(file.preview || '#', '_blank')} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-xl transition-all" title="View Stream"><ExternalLink size={20} /></button>
                            <button onClick={() => downloadFile(file)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-xl transition-all" title="Download"><Download size={20} /></button>
                            <button onClick={() => { setFiles(prev => prev.filter(f => f._id !== file._id)); showStatus('success', 'Purged resource node'); }} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-xl rounded-xl transition-all" title="Delete"><Trash2 size={20} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-5 py-2 text-[10px] font-black bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all uppercase">Prev</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-5 py-2 text-[10px] font-black bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all uppercase">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
};

export default App;