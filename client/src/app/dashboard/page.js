'use client';

import { useEffect, useState } from 'react';
import { useStore, getImageUrl } from '../../store/useStore';
import { useRouter } from 'next/navigation';
import { 
  User, LayoutDashboard, PlusCircle, ArrowUpRight, ArrowDownLeft, 
  CheckCircle, XCircle, AlertTriangle, ShieldCheck, Clock 
} from 'lucide-react';

export default function UserDashboard() {
  const { 
    user, 
    token, 
    sales, 
    purchases, 
    dashboardLoading,
    fetchDashboardData, 
    submitItem, 
    sellerAcceptBid, 
    sellerRejectBid,
    buyerConfirmDeal,
    buyerRefuseDeal 
  } = useStore();

  const router = useRouter();

  // Item Submit Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Watches');
  const [originalValue, setOriginalValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Tab State: 'buyer' or 'seller'
  const [activeTab, setActiveTab] = useState('buyer');

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      fetchDashboardData();
    }
  }, [token, router, fetchDashboardData]);

  if (!user) return null;

  // Clean up previews object URLs
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    setFormError('');
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Validate file formats
    const invalidType = files.find(file => {
      const typeMatches = allowedTypes.includes(file.type.toLowerCase());
      const extMatches = /\.(jpg|jpeg|png|webp)$/i.test(file.name);
      return !typeMatches && !extMatches;
    });

    if (invalidType) {
      setFormError('Unsupported file type. Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    // Validate size limit (5MB per image)
    const maxSizeBytes = 5 * 1024 * 1024;
    const oversizedFile = files.find(file => file.size > maxSizeBytes);
    if (oversizedFile) {
      setFormError(`File "${oversizedFile.name}" exceeds the 5 MB limit.`);
      return;
    }

    // Validate count (Max 5 images)
    if (selectedFiles.length + files.length > 5) {
      setFormError('Maximum 5 images allowed per listing.');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (idxToRemove) => {
    URL.revokeObjectURL(previews[idxToRemove]);
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== idxToRemove));
    setPreviews(previews.filter((_, idx) => idx !== idxToRemove));
  };

  const moveFile = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= selectedFiles.length) return;

    const swappedFiles = [...selectedFiles];
    const tempFile = swappedFiles[idx];
    swappedFiles[idx] = swappedFiles[newIdx];
    swappedFiles[newIdx] = tempFile;

    const swappedPreviews = [...previews];
    const tempPreview = swappedPreviews[idx];
    swappedPreviews[idx] = swappedPreviews[newIdx];
    swappedPreviews[newIdx] = tempPreview;

    setSelectedFiles(swappedFiles);
    setPreviews(swappedPreviews);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (selectedFiles.length === 0) {
      setFormError('Please select or drag-and-drop at least one image.');
      return;
    }

    setFormLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('originalValue', originalValue);

    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    const res = await submitItem(formData, (percent) => {
      setUploadProgress(percent);
    });

    setFormLoading(false);
    setUploadProgress(0);

    if (res.success) {
      setFormSuccess('Item listed and queued successfully!');
      setTitle('');
      setDescription('');
      setOriginalValue('');
      previews.forEach(p => URL.revokeObjectURL(p));
      setSelectedFiles([]);
      setPreviews([]);
      fetchDashboardData();
      // Auto switch to seller tab to see the listing
      setActiveTab('seller');
    } else {
      setFormError(res.error || 'Failed to submit listing');
    }
  };

  const handleSellerAccept = async (txId) => {
    if (confirm('Accept this highest bid? This will lock in the bid and request buyer confirmation.')) {
      const res = await sellerAcceptBid(txId);
      if (res.success) {
        alert(res.message);
      } else {
        alert(res.error || 'Operation failed');
      }
    }
  };

  const handleSellerReject = async (txId) => {
    if (confirm('Reject this highest bid? The item will be marked as CANCELLED.')) {
      const res = await sellerRejectBid(txId);
      if (res.success) {
        alert(res.message);
      } else {
        alert(res.error || 'Operation failed');
      }
    }
  };

  const handleBuyerConfirm = async (txId) => {
    if (confirm('Confirm and complete this luxury transaction?')) {
      const res = await buyerConfirmDeal(txId);
      if (res.success) {
        alert(res.message);
      } else {
        alert(res.error || 'Operation failed');
      }
    }
  };

  const handleBuyerRefuse = async (txId) => {
    const warningText = `CRITICAL WARNING: Refusing this transaction will immediately halve your reputation score from ${Math.round(user.reputation)} to ${Math.round(user.reputation / 2)}!\n\nDo you want to proceed and accept this reputation penalty?`;
    if (confirm(warningText)) {
      const res = await buyerRefuseDeal(txId);
      if (res.success) {
        alert(res.message);
      } else {
        alert(res.error || 'Operation failed');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Banner */}
      <div className="glass-panel p-6 rounded-xl border border-luxury-border/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
            <User className="w-6 h-6 text-luxury-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-luxury-text">{user.name}</h1>
            <p className="text-xs text-luxury-muted">{user.email}</p>
          </div>
        </div>

        {/* Reputation Card */}
        <div className="flex items-center gap-4 px-6 py-3 rounded-lg bg-luxury-surface border border-luxury-border/60">
          <div>
            <span className="text-[10px] text-luxury-muted uppercase font-bold tracking-wider">Collector Standing</span>
            <p className="text-lg font-bold font-display text-luxury-gold mt-0.5">
              {Math.round(user.reputation)} <span className="text-xs text-luxury-muted">/ 100</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/20">
            <ShieldCheck className="w-5 h-5 text-luxury-gold" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-luxury-border/30 gap-6">
        <button
          onClick={() => setActiveTab('buyer')}
          className={`pb-3 text-sm font-semibold tracking-wide font-display transition-colors border-b-2 ${
            activeTab === 'buyer' ? 'border-b-luxury-gold text-luxury-gold' : 'border-b-transparent text-luxury-muted hover:text-luxury-text'
          }`}
        >
          BUYER PORTFOLIO
        </button>
        <button
          onClick={() => setActiveTab('seller')}
          className={`pb-3 text-sm font-semibold tracking-wide font-display transition-colors border-b-2 ${
            activeTab === 'seller' ? 'border-b-luxury-gold text-luxury-gold' : 'border-b-transparent text-luxury-muted hover:text-luxury-text'
          }`}
        >
          SELLER PORTFOLIO
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 text-sm font-semibold tracking-wide font-display transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'submit' ? 'border-b-luxury-gold text-luxury-gold' : 'border-b-transparent text-luxury-muted hover:text-luxury-text'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> SUBMIT LISTING
        </button>
      </div>

      {/* Dashboard Loading */}
      {dashboardLoading && activeTab !== 'submit' ? (
        <div className="flex justify-center items-center h-48">
          <span className="text-xs font-semibold font-display tracking-widest text-luxury-gold live-pulse">
            LOADING PORTFOLIO TRANSACTIONS...
          </span>
        </div>
      ) : (
        <>
          {/* BUYER TAB */}
          {activeTab === 'buyer' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-luxury-muted">Bid Wins & Purchases</h2>
              
              {purchases.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {purchases.map((tx) => {
                    const isPendingAction = tx.status === 'PENDING';
                    const item = tx.auction.item;

                    return (
                      <div 
                        key={tx.id} 
                        className={`glass-panel p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                          isPendingAction ? 'border-luxury-gold/30 shadow-gold-glow bg-luxury-surface/40' : 'border-luxury-border/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-luxury-surface/80 border border-luxury-border flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={getImageUrl(item.images?.[0]?.url) || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000'} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-luxury-text line-clamp-1">{item.title}</h3>
                              <span className="text-[10px] font-bold text-luxury-gold uppercase px-2 py-0.5 rounded bg-luxury-gold/10 border border-luxury-gold/20 flex items-center gap-1 shrink-0">
                                <ArrowDownLeft className="w-3 h-3" /> Bid Win
                              </span>
                            </div>
                            <p className="text-xs text-luxury-muted mt-1">Final Bid: <span className="font-bold text-luxury-gold">${tx.amount.toLocaleString()}</span></p>
                          </div>
                        </div>

                        {/* Status / Confirm Buttons */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 border-luxury-border/30 pt-3 md:pt-0">
                          {isPendingAction ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full justify-end">
                              <div className="flex items-center gap-1.5 text-xs text-luxury-gold bg-luxury-gold/5 border border-luxury-gold/20 p-2 rounded max-w-[280px]">
                                <AlertTriangle className="w-4 h-4 text-luxury-gold shrink-0" />
                                <span className="leading-tight">Verify deal details. Refusal halves reputation.</span>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handleBuyerConfirm(tx.id)}
                                  className="px-4 py-2 bg-luxury-green hover:bg-emerald-600 text-luxury-bg font-bold font-display text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> CONFIRM
                                </button>
                                <button
                                  onClick={() => handleBuyerRefuse(tx.id)}
                                  className="px-4 py-2 border border-luxury-red hover:bg-luxury-red/10 text-luxury-red font-bold font-display text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> REFUSE
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded text-xs font-bold ${
                                tx.status === 'COMPLETED' ? 'bg-luxury-green/20 text-luxury-green border border-luxury-green/30' :
                                'bg-luxury-red/20 text-luxury-red border border-luxury-red/30'
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-xl border border-luxury-border/30 bg-luxury-surface/10">
                  <p className="text-xs text-luxury-muted">You have not won any auctions yet.</p>
                </div>
              )}
            </div>
          )}

          {/* SELLER TAB */}
          {activeTab === 'seller' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-luxury-muted">My Listed Items & Sales</h2>

              {sales.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {sales.map((tx) => {
                    const isPendingAction = tx.status === 'PENDING';
                    const item = tx.auction.item;

                    return (
                      <div 
                        key={tx.id} 
                        className={`glass-panel p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                          isPendingAction ? 'border-luxury-gold/30 shadow-gold-glow bg-luxury-surface/40' : 'border-luxury-border/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-luxury-surface/80 border border-luxury-border flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={getImageUrl(item.images?.[0]?.url) || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000'} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-luxury-text line-clamp-1">{item.title}</h3>
                              <span className="text-[10px] font-bold text-luxury-green uppercase px-2 py-0.5 rounded bg-luxury-green/10 border border-luxury-green/20 flex items-center gap-1 shrink-0">
                                <ArrowUpRight className="w-3 h-3" /> My Listing
                              </span>
                            </div>
                            <p className="text-xs text-luxury-muted mt-1">
                              Highest Bid: <span className="font-bold text-luxury-gold">${tx.amount.toLocaleString()}</span> (Bidder: {tx.buyer.name})
                            </p>
                          </div>
                        </div>

                        {/* Status / Respond Buttons */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 border-luxury-border/30 pt-3 md:pt-0">
                          {isPendingAction ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full justify-end">
                              <div className="flex items-center gap-1.5 text-xs text-luxury-muted bg-luxury-card p-2 rounded">
                                <Clock className="w-4 h-4 shrink-0 text-luxury-gold" />
                                <span>Awaiting response.</span>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handleSellerAccept(tx.id)}
                                  className="px-4 py-2 bg-luxury-gold hover:bg-luxury-goldSoft text-luxury-bg font-bold font-display text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> ACCEPT BID
                                </button>
                                <button
                                  onClick={() => handleSellerReject(tx.id)}
                                  className="px-4 py-2 border border-luxury-red hover:bg-luxury-red/10 text-luxury-red font-bold font-display text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> REJECT BID
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className={`px-3 py-1 rounded text-xs font-bold ${
                              tx.status === 'COMPLETED' ? 'bg-luxury-green/20 text-luxury-green border border-luxury-green/30' :
                              'bg-luxury-red/20 text-luxury-red border border-luxury-red/30'
                            }`}>
                              {tx.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-xl border border-luxury-border/30 bg-luxury-surface/10">
                  <p className="text-xs text-luxury-muted">You have not listed any items yet.</p>
                </div>
              )}
            </div>
          )}

          {/* SUBMIT LISTING TAB */}
          {activeTab === 'submit' && (
            <div className="max-w-xl mx-auto glass-panel p-8 rounded-xl border border-luxury-border/40">
              <h2 className="text-lg font-bold font-display text-luxury-text mb-6">List Luxury Masterpiece</h2>

              {formSuccess && (
                <div className="mb-6 rounded-lg bg-luxury-green/10 border border-luxury-green/30 p-4 flex items-center gap-3 text-xs text-luxury-green">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="mb-6 rounded-lg bg-luxury-red/10 border border-luxury-red/30 p-4 flex items-center gap-3 text-xs text-luxury-red">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateItem} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">Item Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm"
                    placeholder="e.g. 1968 Rolex Submariner Ref. 5513"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm"
                    >
                      <option value="Watches">Watches</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Cars">Cars</option>
                      <option value="Fine Art">Fine Art</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">Original Value (USD)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={originalValue}
                      onChange={(e) => setOriginalValue(e.target.value)}
                      className="mt-1 block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm"
                      placeholder="e.g. 15000"
                    />
                    <span className="text-[10px] text-luxury-muted mt-1 block">
                      Starting bid will be auto-set to: <span className="text-luxury-gold font-bold">${originalValue ? (originalValue * 0.10).toLocaleString() : '0'}</span> (10% of value).
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-luxury-muted block mb-2">Item Images (Max 5)</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload-input').click()}
                    className={`relative w-full py-8 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      isDragging 
                        ? 'border-luxury-gold bg-luxury-gold/5 shadow-gold-glow scale-[1.01]' 
                        : 'border-luxury-border bg-luxury-surface hover:border-luxury-gold/50 hover:bg-luxury-surface/50'
                    }`}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <PlusCircle className={`w-8 h-8 mb-2 transition-colors ${isDragging ? 'text-luxury-gold' : 'text-luxury-muted'}`} />
                    <p className="text-sm font-bold text-luxury-text font-display">Drag & Drop Images Here</p>
                    <p className="text-xs text-luxury-muted mt-1">or Click to Upload</p>
                    <p className="text-[10px] text-luxury-muted mt-2">JPG, JPEG, PNG, WEBP • Max 5MB per image</p>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <span className="text-[10px] text-luxury-muted mt-1.5 block">
                      {selectedFiles.length} of 5 images selected. First image will be the cover image.
                    </span>
                  )}
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                    {previews.map((previewUrl, idx) => (
                      <div key={previewUrl} className="relative group aspect-square rounded-lg overflow-hidden border border-luxury-border/80 bg-luxury-surface/40 flex items-center justify-center">
                        <img 
                          src={previewUrl} 
                          alt={`Preview ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        
                        {idx === 0 && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-luxury-gold text-luxury-bg text-[8px] font-extrabold uppercase tracking-wider shadow-gold-glow">
                            Cover
                          </div>
                        )}

                        <div className="absolute inset-0 bg-luxury-bg/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="self-end p-1 rounded-full bg-luxury-red/10 border border-luxury-red/30 text-luxury-red hover:bg-luxury-red hover:text-luxury-bg transition-colors"
                            title="Remove Image"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          <span className="text-[9px] font-bold text-luxury-text text-center truncate w-full px-1">
                            {selectedFiles[idx]?.name}
                          </span>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => { e.stopPropagation(); moveFile(idx, -1); }}
                              className="p-1 rounded bg-luxury-surface border border-luxury-border text-luxury-text hover:border-luxury-gold disabled:opacity-30 transition-colors"
                              title="Move Left"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={idx === selectedFiles.length - 1}
                              onClick={(e) => { e.stopPropagation(); moveFile(idx, 1); }}
                              className="p-1 rounded bg-luxury-surface border border-luxury-border text-luxury-text hover:border-luxury-gold disabled:opacity-30 transition-colors"
                              title="Move Right"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">Item Description</label>
                  <textarea
                    required
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm"
                    placeholder="Provide full description of item provenance, features, and restoration details."
                  />
                </div>

                {formLoading && uploadProgress > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-luxury-muted font-bold tracking-wider">
                      <span>UPLOADING ARTWORK IMAGES...</span>
                      <span className="text-luxury-gold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-luxury-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-luxury-gold shadow-gold-glow transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold font-display rounded-lg text-luxury-bg bg-luxury-gold hover:bg-luxury-goldSoft transition-all shadow-gold-glow disabled:opacity-50"
                >
                  {formLoading ? (uploadProgress > 0 ? `UPLOADING ${uploadProgress}%` : 'LISTING ITEM...') : 'LIST ITEM & ENQUEUE'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
