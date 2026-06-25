'use client';

import { useEffect, useState } from 'react';
import { useStore, getImageUrl } from '../store/useStore';
import HeroCarousel from '../components/HeroCarousel';
import Link from 'next/link';
import { ArrowRight, Clock, Award, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const { liveNow, upNext, upcoming, fetchQueue, token } = useStore();
  const [upNextCountdown, setUpNextCountdown] = useState('');

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Handle client-side countdown timer for the "UP NEXT" auction
  useEffect(() => {
    if (!upNext) {
      setUpNextCountdown('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(upNext.startTime);
      const diffMs = startTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setUpNextCountdown('Starting...');
        fetchQueue();
      } else {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        setUpNextCountdown(`Starts in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [upNext, fetchQueue]);

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 py-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-[10px] font-bold tracking-widest text-luxury-gold uppercase">
          <Zap className="w-3.5 h-3.5" /> Synchronized Live Rooms
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-luxury-text">
          The Luxury Real-Time <br />
          <span className="gold-text-gradient">Scheduled Auction Platform</span>
        </h1>
        <p className="text-sm text-luxury-muted max-w-lg mx-auto">
          Experience elite bidding with platform-controlled sequential slots. Trust-based reputation filters out suspicious players.
        </p>
      </div>

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Queue Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        
        {/* LIVE NOW */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-luxury-green live-pulse" />
            <h2 className="text-lg font-bold font-display uppercase tracking-wider text-luxury-text">Live Now</h2>
          </div>

          {liveNow ? (
            <div className="glass-panel rounded-xl p-6 border-l-4 border-l-luxury-green relative hover:shadow-green-glow transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Image */}
                <div className="md:col-span-2 aspect-[4/3] rounded-lg overflow-hidden border border-luxury-border/40 bg-luxury-surface/50">
                  <img 
                    src={getImageUrl(liveNow.item.images?.[0]?.url) || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000'} 
                    alt={liveNow.item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Details */}
                <div className="md:col-span-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-muted">{liveNow.item.category}</span>
                    <h3 className="text-xl font-bold font-display text-luxury-text mt-1 line-clamp-1">{liveNow.item.title}</h3>
                    <p className="text-xs text-luxury-muted mt-2 line-clamp-3">{liveNow.item.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-luxury-border/40 mt-4">
                    <div>
                      <p className="text-[10px] text-luxury-muted uppercase font-semibold">Starting Bid</p>
                      <p className="text-sm font-bold text-luxury-gold">${liveNow.startingBid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-luxury-muted uppercase font-semibold">Seller Reputation</p>
                      <p className="text-sm font-bold text-luxury-text">{Math.round(liveNow.item.seller.reputation)}/100</p>
                    </div>

                    <Link 
                      href={token ? `/auction/${liveNow.id}` : '/login'}
                      className="inline-flex items-center gap-1.5 text-xs font-bold font-display px-4 py-2.5 rounded-lg bg-luxury-green text-luxury-bg hover:bg-emerald-600 transition-all duration-300 shadow-green-glow"
                    >
                      ENTER ROOM <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 flex items-center justify-center border border-dashed border-luxury-border/60 bg-luxury-surface/20 min-h-[220px]">
              <div className="text-center max-w-sm">
                <Clock className="w-8 h-8 text-luxury-muted mx-auto mb-3" />
                <p className="text-sm font-bold text-luxury-text">No active live auction</p>
                <p className="text-xs text-luxury-muted mt-1">
                  The schedule is empty or waiting for the next slot to transition. Upcoming listings are queued below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* UP NEXT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-luxury-gold" />
            <h2 className="text-lg font-bold font-display uppercase tracking-wider text-luxury-text">Up Next</h2>
          </div>

          {upNext ? (
            <div className="glass-panel rounded-xl p-6 border border-luxury-gold/20 flex flex-col justify-between hover:shadow-gold-glow transition-all duration-300 min-h-[260px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-muted">{upNext.item.category}</span>
                  <span className="text-xs font-bold font-display text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded border border-luxury-gold/20 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {upNextCountdown || 'Loading...'}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display text-luxury-text line-clamp-1">{upNext.item.title}</h3>
                <p className="text-xs text-luxury-muted mt-2 line-clamp-3">{upNext.item.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-luxury-border/40 mt-4">
                <div>
                  <p className="text-[10px] text-luxury-muted uppercase font-semibold">Starting Bid</p>
                  <p className="text-sm font-bold text-luxury-gold">${upNext.startingBid.toLocaleString()}</p>
                </div>
                <Link 
                  href={token ? `/auction/${upNext.id}` : '/login'}
                  className="inline-flex items-center gap-1 text-xs font-bold font-display px-3 py-2 rounded-lg bg-luxury-surface border border-luxury-border hover:border-luxury-gold/50 text-luxury-text transition-colors duration-300"
                >
                  PREVIEW ROOM
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 flex items-center justify-center border border-dashed border-luxury-border/60 bg-luxury-surface/20 min-h-[260px]">
              <div className="text-center max-w-sm">
                <Clock className="w-6 h-6 text-luxury-muted mx-auto mb-3" />
                <p className="text-xs font-bold text-luxury-text">No scheduled item queued up next</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UPCOMING QUEUE LIST */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display uppercase tracking-wider text-luxury-text">Upcoming Queue</h2>
        
        {upcoming.length > 0 ? (
          <div className="glass-panel rounded-xl overflow-hidden border border-luxury-border/30">
            <div className="divide-y divide-luxury-border/30">
              {upcoming.map((auction) => {
                const start = new Date(auction.startTime);
                return (
                  <div 
                    key={auction.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 hover:bg-luxury-surface/40 transition-colors duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-12 h-12 rounded overflow-hidden bg-luxury-surface/50 border border-luxury-border/40 shrink-0">
                        <img 
                          src={getImageUrl(auction.item.images?.[0]?.url) || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000'} 
                          alt={auction.item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-luxury-text line-clamp-1">{auction.item.title}</h4>
                        <p className="text-[10px] text-luxury-muted">Category: {auction.item.category}</p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-row items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-luxury-muted uppercase font-medium">Scheduled Start</p>
                        <p className="text-xs font-bold text-luxury-text">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-luxury-muted uppercase font-medium">Starting Bid</p>
                        <p className="text-xs font-bold text-luxury-gold">${auction.startingBid.toLocaleString()}</p>
                      </div>

                      <Link 
                        href={token ? `/auction/${auction.id}` : '/login'}
                        className="text-xs font-bold font-display px-3 py-2 rounded bg-luxury-surface hover:bg-luxury-card border border-luxury-border text-luxury-muted hover:text-luxury-text transition-colors duration-300"
                      >
                        PREVIEW
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 glass-panel rounded-xl border border-luxury-border/30 bg-luxury-surface/10">
            <p className="text-xs text-luxury-muted">No further upcoming slots scheduled.</p>
          </div>
        )}
      </div>

      {/* Platform Features Trust Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-luxury-border/30">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-luxury-gold" />
          </div>
          <div>
            <h4 className="font-bold font-display text-sm text-luxury-text">Synchronized Rooms</h4>
            <p className="text-xs text-luxury-muted mt-1">Sequential 10-minute slots broadcast real-time tick timers directly controlled by our backend scheduler.</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-luxury-gold" />
          </div>
          <div>
            <h4 className="font-bold font-display text-sm text-luxury-text">Reputation Verification</h4>
            <p className="text-xs text-luxury-muted mt-1">Bidder reputation is visible in rooms and halved automatically if a won deal is refused, stopping fake bidders.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-luxury-gold" />
          </div>
          <div>
            <h4 className="font-bold font-display text-sm text-luxury-text">Transactional Security</h4>
            <p className="text-xs text-luxury-muted mt-1">Concurring bids are processed inside strict backend DB transactions to prevent double-bidding and late requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
