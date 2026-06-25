'use client';

import { useEffect, useState } from 'react';
import { useStore, getImageUrl } from '../../../store/useStore';
import { useRouter } from 'next/navigation';
import { Clock, Eye, AlertCircle, ShieldCheck, ArrowRight, Gavel, CheckCircle } from 'lucide-react';

export default function AuctionRoom({ params }) {
  const { id: auctionId } = params;

  const {
    user,
    token,
    activeAuction,
    activeBids,
    activeViewers,
    activeBidders,
    activeCountdown,
    roomLoading,
    joinAuctionRoom,
    leaveAuctionRoom,
    placeBid
  } = useStore();

  const router = useRouter();

  // Bidding Form States
  const [customBid, setCustomBid] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    joinAuctionRoom(auctionId);

    return () => {
      leaveAuctionRoom(auctionId);
    };
  }, [auctionId, token, router, joinAuctionRoom, leaveAuctionRoom]);

  // Set initial selected image once auction loads
  useEffect(() => {
    if (activeAuction?.item?.images?.[0]) {
      setSelectedImage(getImageUrl(activeAuction.item.images[0].url));
    }
  }, [activeAuction]);

  if (roomLoading || !activeAuction) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] space-y-4">
        <span className="text-sm font-semibold font-display tracking-widest text-luxury-gold live-pulse uppercase">
          ESTABLISHING SECURE REAL-TIME LINK...
        </span>
        <p className="text-xs text-luxury-muted">Connecting to websocket room: auction_{auctionId.slice(0, 8)}</p>
      </div>
    );
  }

  const item = activeAuction.item;
  const highestBidRecord = activeBids[0];
  const currentPrice = highestBidRecord ? highestBidRecord.amount : activeAuction.startingBid;
  const isSeller = item.sellerId === user?.id;
  const isHighestBidder = highestBidRecord?.bidderId === user?.id;

  const handlePlaceBid = async (amountToPlace) => {
    setErrorMessage('');
    setSuccessMessage('');
    setBidLoading(true);

    const numericAmount = parseFloat(amountToPlace);
    
    if (isNaN(numericAmount) || numericAmount <= currentPrice) {
      setErrorMessage(`Bid must be strictly higher than current price ($${currentPrice.toLocaleString()})`);
      setBidLoading(false);
      return;
    }

    const res = await placeBid(numericAmount);
    setBidLoading(false);

    if (res.success) {
      setSuccessMessage(`Your bid of $${numericAmount.toLocaleString()} has been submitted successfully!`);
      setCustomBid('');
      // Flash message clears after 3s
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to place bid');
    }
  };

  const handleIncrement = (incValue) => {
    const nextBid = currentPrice + incValue;
    handlePlaceBid(nextBid);
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return 'Synced';
    if (seconds <= 0) return 'Ended';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Room Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-luxury-border/30">
        <div>
          <span className="text-xs text-luxury-gold font-bold uppercase tracking-widest font-display">
            Active Bid Room
          </span>
          <h1 className="text-2xl font-bold font-display text-luxury-text mt-1">{item.title}</h1>
        </div>

        {/* Sync Info Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Watching */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-luxury-surface border border-luxury-border/60 text-xs">
            <Eye className="w-4 h-4 text-luxury-muted" />
            <span className="font-bold text-luxury-text">{activeViewers} Watching</span>
            <span className="text-[10px] text-luxury-muted">({activeBidders} bidders)</span>
          </div>

          {/* Connection Sync status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxury-surface border border-luxury-border/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-luxury-green live-pulse" />
            <span className="font-semibold text-luxury-text">WS Sync Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Visual Gallery and Item Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Image */}
          <div className="glass-panel p-2 rounded-xl border border-luxury-border/40 aspect-[4/3] max-h-[480px] overflow-hidden flex items-center justify-center bg-luxury-surface/20">
            <img 
              src={selectedImage || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000'} 
              alt={item.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Gallery Row */}
          {item.images && item.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {item.images.map((img) => {
                const resolvedUrl = getImageUrl(img.url);
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(resolvedUrl)}
                    className={`w-20 h-16 rounded overflow-hidden border shrink-0 transition-all ${
                      selectedImage === resolvedUrl ? 'border-luxury-gold ring-1 ring-luxury-gold' : 'border-luxury-border/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={resolvedUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Specifications */}
          <div className="glass-panel p-6 rounded-xl border border-luxury-border/30 space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-widest text-luxury-gold">Provenance & Details</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs py-2 border-y border-luxury-border/20">
              <div>
                <p className="text-luxury-muted uppercase font-medium">Category</p>
                <p className="font-bold text-luxury-text mt-0.5">{item.category}</p>
              </div>
              <div>
                <p className="text-luxury-muted uppercase font-medium">Original Value</p>
                <p className="font-bold text-luxury-text mt-0.5">${item.originalValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-luxury-muted uppercase font-medium">Seller</p>
                <p className="font-bold text-luxury-text mt-0.5">{item.seller.name}</p>
              </div>
              <div>
                <p className="text-luxury-muted uppercase font-medium">Seller Standing</p>
                <p className="font-bold text-luxury-gold mt-0.5">{Math.round(item.seller.reputation)}/100 REP</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-luxury-muted leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Bid Control Desk and Bid History */}
        <div className="space-y-6">
          {/* Bid Control Desk */}
          <div className={`glass-panel p-6 rounded-xl border flex flex-col justify-between transition-all duration-500 ${
            activeAuction.status !== 'LIVE' ? 'border-luxury-border/30 opacity-75' :
            isHighestBidder ? 'border-luxury-green/40 shadow-green-glow' : 'border-luxury-gold/30 hover:border-luxury-gold/50 shadow-gold-glow'
          }`}>
            <div className="space-y-5">
              {/* Header: Countdown Timer */}
              <div className="flex items-center justify-between border-b border-luxury-border/40 pb-3">
                <span className="text-xs font-bold text-luxury-muted uppercase tracking-wider">ROOM LIFECYCLE</span>
                
                <span className={`text-sm font-bold font-display px-3 py-1 rounded flex items-center gap-1.5 ${
                  activeAuction.status !== 'LIVE' ? 'bg-luxury-red/20 text-luxury-red border border-luxury-red/30' :
                  (activeCountdown && activeCountdown <= 20) ? 'bg-luxury-red/20 text-luxury-red border border-luxury-red/30 live-pulse' :
                  'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20'
                }`}>
                  <Clock className="w-4 h-4" />
                  {activeAuction.status === 'LIVE' ? formatTime(activeCountdown) : activeAuction.status}
                </span>
              </div>

              {/* Prices info */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-luxury-muted uppercase font-semibold">Starting Bid</p>
                  <p className="text-sm font-semibold text-luxury-text">${activeAuction.startingBid.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-luxury-gold uppercase font-bold tracking-wider">Current Price</p>
                  <p className="text-2xl font-bold font-display text-luxury-gold gold-glow-text">${currentPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="rounded bg-luxury-red/10 border border-luxury-red/30 p-2.5 flex items-center gap-2 text-xs text-luxury-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="rounded bg-luxury-green/10 border border-luxury-green/30 p-2.5 flex items-center gap-2 text-xs text-luxury-green">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">{successMessage}</span>
                </div>
              )}

              {/* Status Banner */}
              {isSeller && activeAuction.status === 'LIVE' && (
                <div className="rounded bg-luxury-gold/10 border border-luxury-gold/30 p-3 text-center text-xs text-luxury-gold">
                  You are the seller. Bids are handled automatically.
                </div>
              )}

              {isHighestBidder && activeAuction.status === 'LIVE' && (
                <div className="rounded bg-luxury-green/10 border border-luxury-green/30 p-3 text-center text-xs text-luxury-green font-semibold">
                  You hold the highest bid!
                </div>
              )}

              {/* Bidding Buttons */}
              {activeAuction.status === 'LIVE' && !isSeller && (
                <div className="space-y-4">
                  {/* Quick increments */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold font-display">
                    <button
                      onClick={() => handleIncrement(100)}
                      disabled={bidLoading}
                      className="py-2.5 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text hover:border-luxury-gold hover:bg-luxury-card transition-all disabled:opacity-50"
                    >
                      +$100
                    </button>
                    <button
                      onClick={() => handleIncrement(500)}
                      disabled={bidLoading}
                      className="py-2.5 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text hover:border-luxury-gold hover:bg-luxury-card transition-all disabled:opacity-50"
                    >
                      +$500
                    </button>
                    <button
                      onClick={() => handleIncrement(1000)}
                      disabled={bidLoading}
                      className="py-2.5 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text hover:border-luxury-gold hover:bg-luxury-card transition-all disabled:opacity-50"
                    >
                      +$1,000
                    </button>
                    <button
                      onClick={() => handleIncrement(5000)}
                      disabled={bidLoading}
                      className="py-2.5 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text hover:border-luxury-gold hover:bg-luxury-card transition-all disabled:opacity-50"
                    >
                      +$5,000
                    </button>
                  </div>

                  {/* Custom Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-xs font-bold text-luxury-muted">$</span>
                      <input
                        type="number"
                        placeholder="Custom bid"
                        value={customBid}
                        onChange={(e) => setCustomBid(e.target.value)}
                        disabled={bidLoading}
                        className="w-full pl-7 pr-3 py-2.5 border border-luxury-border bg-luxury-surface rounded-lg text-xs text-luxury-text focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <button
                      onClick={() => handlePlaceBid(customBid)}
                      disabled={bidLoading}
                      className="px-4 bg-luxury-gold hover:bg-luxury-goldSoft text-luxury-bg font-bold font-display text-xs rounded-lg transition-all shadow-gold-glow flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      PLACE <Gavel className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {activeAuction.status !== 'LIVE' && (
                <div className="rounded bg-luxury-surface border border-luxury-border p-4 text-center text-xs text-luxury-muted font-medium">
                  Bidding Completed.
                </div>
              )}
            </div>
          </div>

          {/* Live Bid Ticker Log */}
          <div className="glass-panel p-6 rounded-xl border border-luxury-border/30 flex-1 flex flex-col min-h-[280px] max-h-[360px] overflow-hidden">
            <h2 className="text-xs font-bold font-display uppercase tracking-widest text-luxury-muted mb-4">Live Bid History</h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {activeBids.length > 0 ? (
                activeBids.map((bid, i) => {
                  const isTopBid = i === 0;
                  const formattedTime = new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  return (
                    <div 
                      key={bid.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all duration-300 ${
                        isTopBid 
                          ? 'border-luxury-green/30 bg-luxury-green/5 shadow-green-glow' 
                          : 'border-luxury-border/40 bg-luxury-surface/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-luxury-text">{bid.bidder.name}</p>
                          <span className="text-[9px] font-bold text-luxury-gold bg-luxury-gold/5 px-1 rounded border border-luxury-gold/15">
                            {Math.round(bid.bidder.reputation)} REP
                          </span>
                        </div>
                        <p className="text-[9px] text-luxury-muted mt-0.5">{formattedTime}</p>
                      </div>
                      <p className={`text-sm font-bold font-display ${
                        isTopBid ? 'text-luxury-green green-glow-text' : 'text-luxury-text'
                      }`}>
                        ${bid.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-center py-8">
                  <p className="text-xs text-luxury-muted font-medium">No bids have been submitted yet. Starting bid is active.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
