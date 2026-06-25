'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useStore, getImageUrl } from '../store/useStore';
import { ArrowRight, Clock, ShieldAlert } from 'lucide-react';

export default function HeroCarousel() {
  const { liveNow, upNext, upcoming, fetchQueue, token } = useStore();
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  // Combine items for carousel
  const carouselItems = [];
  if (liveNow) carouselItems.push({ ...liveNow, isLive: true });
  if (upNext) carouselItems.push({ ...upNext, isNext: true });
  upcoming.forEach(item => carouselItems.push({ ...item, isUpcoming: true }));

  const activeItems = carouselItems.slice(0, 5); // display up to 5 items in rotation

  function resetTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }

  useEffect(() => {
    fetchQueue();
    // Refresh queue every 15s to sync listings
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  useEffect(() => {
    resetTimeout();
    if (activeItems.length > 3) {
      timeoutRef.current = setTimeout(
        () => setIndex((prevIndex) => (prevIndex + 1) % (activeItems.length - 2)),
        6000 // Shift every 6 seconds
      );
    }
    return () => resetTimeout();
  }, [index, activeItems.length]);

  if (activeItems.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center border border-luxury-border/30 rounded-xl bg-luxury-surface/50">
        <div className="text-center">
          <Clock className="w-10 h-10 text-luxury-gold mx-auto mb-4 live-pulse" />
          <p className="text-luxury-muted font-medium">No live or scheduled auctions currently in the vault.</p>
        </div>
      </div>
    );
  }

  // Calculate sliding container translation
  const translatePercent = activeItems.length > 3 ? -index * 33.333 : 0;

  return (
    <div className="relative overflow-hidden w-full py-8">
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-luxury-gold font-semibold font-display">Showcase</span>
          <h2 className="text-2xl font-bold font-display tracking-tight text-luxury-text">Featured Masterpieces</h2>
        </div>
        <div className="flex gap-2">
          {activeItems.length > 3 && 
            Array.from({ length: activeItems.length - 2 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === i ? 'bg-luxury-gold w-6' : 'bg-luxury-border/80'
                }`}
              />
            ))
          }
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] gap-6"
          style={{ 
            transform: `translateX(${translatePercent}%)`,
            width: activeItems.length > 3 ? `${(activeItems.length * 33.33) + 20}%` : '100%' 
          }}
        >
          {activeItems.map((auction, idx) => {
            const item = auction.item;
            const primaryImage = item.images && item.images[0] ? getImageUrl(item.images[0].url) : 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000';
            const startingBid = auction.startingBid;
            const isLive = auction.status === 'LIVE';
            const isNext = auction.isNext;

            return (
              <div 
                key={auction.id}
                className="w-full md:w-[calc(33.333%-16px)] shrink-0 group relative rounded-xl glass-panel p-4 flex flex-col justify-between hover:border-luxury-gold/30 hover:shadow-gold-glow transition-all duration-500"
              >
                {/* State Tag */}
                <div className="absolute top-6 left-6 z-10">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-green/20 border border-luxury-green/50 text-[10px] font-bold tracking-widest text-luxury-green uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-green live-pulse" />
                      Live Now
                    </span>
                  ) : isNext ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-goldGlow/20 border border-luxury-goldGlow/50 text-[10px] font-bold tracking-widest text-luxury-goldGlow uppercase">
                      Up Next
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-muted/20 border border-luxury-border text-[10px] font-bold tracking-widest text-luxury-muted uppercase">
                      Scheduled
                    </span>
                  )}
                </div>

                {/* Primary Image */}
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-luxury-surface/50 border border-luxury-border/40">
                  <img 
                    src={primaryImage} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg/90 via-transparent to-transparent opacity-80" />
                  
                  {/* Price Banner overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-luxury-muted uppercase tracking-wider font-semibold">Value</p>
                      <p className="text-sm font-bold text-luxury-text">${item.originalValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-luxury-gold uppercase tracking-wider font-semibold">Starting Bid</p>
                      <p className="text-sm font-bold text-luxury-gold">${startingBid.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Info & CTA */}
                <div>
                  <h3 className="font-display font-bold text-lg text-luxury-text group-hover:text-luxury-gold transition-colors duration-300 line-clamp-1 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-luxury-muted mb-4 line-clamp-2 h-8">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-luxury-border/40 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-luxury-muted uppercase font-medium">Status</span>
                      <span className={`text-xs font-semibold uppercase ${
                        isLive ? 'text-luxury-green' : 'text-luxury-muted'
                      }`}>
                        {auction.status}
                      </span>
                    </div>

                    <Link 
                      href={token ? `/auction/${auction.id}` : '/login'}
                      className={`inline-flex items-center gap-2 text-xs font-bold font-display px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        isLive 
                          ? 'bg-luxury-green hover:bg-emerald-600 text-luxury-bg shadow-green-glow' 
                          : 'bg-luxury-gold hover:bg-luxury-goldSoft text-luxury-bg shadow-gold-glow'
                      }`}
                    >
                      {token ? 'ENTER ROOM' : 'PLACE BID'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
