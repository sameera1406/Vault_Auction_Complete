'use client';

import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Trophy, Star, Award, Zap } from 'lucide-react';

export default function Leaderboard() {
  const { leaderboard, leaderboardLoading, fetchLeaderboard } = useStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center py-6 space-y-3">
        <Trophy className="w-12 h-12 text-luxury-gold mx-auto" />
        <h1 className="text-3xl font-bold font-display tracking-tight text-luxury-text">
          The Vault <span className="gold-text-gradient">Leaderboard</span>
        </h1>
        <p className="text-xs text-luxury-muted max-w-md mx-auto">
          Honoring our most trusted collectors and active bidders. Reputation is earned by successfully completing deals, and penalized for cancellations.
        </p>
      </div>

      {leaderboardLoading ? (
        <div className="flex justify-center items-center h-48">
          <span className="text-sm text-luxury-gold font-semibold font-display tracking-widest live-pulse">
            LOADING LEADERBOARD STANDINGS...
          </span>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-4">
          {/* Top 3 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="glass-panel p-6 rounded-xl border border-luxury-border/40 text-center relative md:order-1 order-2 md:h-[220px] flex flex-col justify-center">
                <span className="absolute top-4 left-4 text-xs font-bold text-luxury-muted">#2</span>
                <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-luxury-text font-display line-clamp-1">{leaderboard[1].name}</h3>
                <p className="text-xs text-luxury-gold mt-1">REP: {Math.round(leaderboard[1].reputation)}/100</p>
                <div className="mt-4 flex justify-center gap-4 text-[10px] text-luxury-muted uppercase font-medium">
                  <span>{leaderboard[1].bidsCount} Bids</span>
                  <span>{leaderboard[1].winsCount} Wins</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="glass-panel p-8 rounded-xl border border-luxury-gold/30 text-center relative md:order-2 order-1 md:h-[260px] flex flex-col justify-center shadow-gold-glow-lg bg-gradient-to-b from-luxury-card to-luxury-surface">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-luxury-gold text-luxury-bg text-[10px] font-extrabold px-3 py-1 rounded-full tracking-widest uppercase">
                  Grand Collector
                </div>
                <Trophy className="w-14 h-14 text-luxury-gold mx-auto mb-4 live-pulse" />
                <h3 className="font-bold text-lg text-luxury-text font-display line-clamp-1">{leaderboard[0].name}</h3>
                <p className="text-sm font-bold text-luxury-gold mt-1">REP: {Math.round(leaderboard[0].reputation)}/100</p>
                <div className="mt-5 flex justify-center gap-6 text-[10px] text-luxury-muted uppercase font-semibold">
                  <span>{leaderboard[0].bidsCount} Bids</span>
                  <span>{leaderboard[0].winsCount} Wins</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="glass-panel p-6 rounded-xl border border-luxury-border/40 text-center relative md:order-3 order-3 md:h-[200px] flex flex-col justify-center">
                <span className="absolute top-4 left-4 text-xs font-bold text-luxury-muted">#3</span>
                <Award className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h3 className="font-bold text-luxury-text font-display line-clamp-1">{leaderboard[2].name}</h3>
                <p className="text-xs text-luxury-gold mt-1">REP: {Math.round(leaderboard[2].reputation)}/100</p>
                <div className="mt-4 flex justify-center gap-4 text-[10px] text-luxury-muted uppercase font-medium">
                  <span>{leaderboard[2].bidsCount} Bids</span>
                  <span>{leaderboard[2].winsCount} Wins</span>
                </div>
              </div>
            )}
          </div>

          {/* List Remaining */}
          <div className="glass-panel rounded-xl overflow-hidden border border-luxury-border/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-luxury-border/40 bg-luxury-surface/50 text-[10px] text-luxury-muted font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 text-center w-16">Rank</th>
                  <th className="px-6 py-4">Collector</th>
                  <th className="px-6 py-4">Reputation Score</th>
                  <th className="px-6 py-4 text-center">Bids Placed</th>
                  <th className="px-6 py-4 text-center">Auctions Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/30 text-sm">
                {leaderboard.map((collector, index) => (
                  <tr key={collector.id} className="hover:bg-luxury-surface/30 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-luxury-muted">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-luxury-text font-display">
                      {collector.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-luxury-border rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-luxury-gold h-full" 
                            style={{ width: `${collector.reputation}%` }}
                          />
                        </div>
                        <span className="font-semibold text-luxury-gold">{Math.round(collector.reputation)}/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-luxury-muted">
                      {collector.bidsCount}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-luxury-green">
                      {collector.winsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 glass-panel rounded-xl border border-luxury-border/30">
          <p className="text-xs text-luxury-muted">No collectors registered on the platform yet.</p>
        </div>
      )}
    </div>
  );
}
