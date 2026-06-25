'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useRouter } from 'next/navigation';
import { Shield, Trash2, Users, Eye, Landmark, AlertCircle, Ban } from 'lucide-react';

export default function AdminDashboard() {
  const { 
    user, 
    adminStats, 
    adminAuctions, 
    adminUsers, 
    adminLoading, 
    fetchAdminData, 
    adminDeleteAuction, 
    adminDeleteUser 
  } = useStore();
  
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Basic route protection
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchAdminData();
    }
  }, [user, router, fetchAdminData]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const handleDeleteAuction = async (auctionId) => {
    if (confirm('Are you sure you want to permanently remove this listing and all its bids from the system?')) {
      const res = await adminDeleteAuction(auctionId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete listing');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete and ban this user account? All their items and bids will be purged.')) {
      const res = await adminDeleteUser(userId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to ban user');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-luxury-border/30">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-luxury-red font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" /> System Control Unit
          </div>
          <h1 className="text-2xl font-bold font-display text-luxury-text mt-1">Admin Control Room</h1>
        </div>
        <button 
          onClick={fetchAdminData}
          className="text-xs font-bold font-display px-4 py-2 border border-luxury-border bg-luxury-surface hover:bg-luxury-card text-luxury-text rounded-lg transition-colors"
        >
          FORCE RELOAD STATS
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-luxury-red/10 border border-luxury-red/30 p-4 flex items-center gap-3 text-xs text-luxury-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {adminLoading && !adminStats ? (
        <div className="flex justify-center items-center h-48">
          <span className="text-xs font-semibold font-display tracking-widest text-luxury-gold live-pulse">
            LOADING ADMIN METRICS...
          </span>
        </div>
      ) : (
        <>
          {/* Key Stat Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-[10px] text-luxury-muted uppercase font-medium">Bidders</p>
              <p className="text-2xl font-bold font-display text-luxury-text mt-1">{adminStats?.totalUsers}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-[10px] text-luxury-muted uppercase font-medium">Total Slots</p>
              <p className="text-2xl font-bold font-display text-luxury-text mt-1">{adminStats?.totalAuctions}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center border border-luxury-green/20">
              <p className="text-[10px] text-luxury-green uppercase font-semibold">Active Live</p>
              <p className="text-2xl font-bold font-display text-luxury-green mt-1">{adminStats?.activeAuctions}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-[10px] text-luxury-muted uppercase font-medium">Bids Placed</p>
              <p className="text-2xl font-bold font-display text-luxury-text mt-1">{adminStats?.totalBids}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-[10px] text-luxury-muted uppercase font-medium">Deals</p>
              <p className="text-2xl font-bold font-display text-luxury-text mt-1">{adminStats?.totalTransactions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monitor Auctions Queue */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-luxury-muted">Monitor Live Schedule</h2>
              
              <div className="glass-panel rounded-xl overflow-hidden border border-luxury-border/30">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-luxury-border/40 bg-luxury-surface/50 text-luxury-muted uppercase font-bold tracking-wider">
                      <th className="px-4 py-3">Listing Name</th>
                      <th className="px-4 py-3">Seller</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Starting Bid</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-border/30">
                    {adminAuctions.map((auction) => (
                      <tr key={auction.id} className="hover:bg-luxury-surface/20 transition-colors">
                        <td className="px-4 py-3 font-semibold text-luxury-text line-clamp-1 max-w-[200px]">
                          {auction.item.title}
                        </td>
                        <td className="px-4 py-3 text-luxury-muted">
                          {auction.item.seller.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            auction.status === 'LIVE' ? 'bg-luxury-green/20 text-luxury-green border border-luxury-green/30' :
                            auction.status === 'SOLD' ? 'bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30' :
                            auction.status === 'CANCELLED' ? 'bg-luxury-red/20 text-luxury-red border border-luxury-red/30' :
                            'bg-luxury-muted/20 text-luxury-muted border border-luxury-border'
                          }`}>
                            {auction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-luxury-gold">
                          ${auction.startingBid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link 
                              href={`/auction/${auction.id}`}
                              className="p-1 rounded text-luxury-muted hover:text-luxury-text hover:bg-luxury-surface"
                              title="View Room"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteAuction(auction.id)}
                              className="p-1 rounded text-luxury-muted hover:text-luxury-red hover:bg-luxury-red/10"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monitor Users & Suspicious Bidders */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-luxury-muted">Bidders & Reputation</h2>
              
              <div className="glass-panel rounded-xl p-4 border border-luxury-border/30 divide-y divide-luxury-border/30 max-h-[480px] overflow-y-auto">
                {adminUsers.map((u) => {
                  const isSuspicious = u.reputation < 70;
                  return (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className={`font-bold font-display text-sm ${
                          isSuspicious ? 'text-luxury-red' : 'text-luxury-text'
                        }`}>
                          {u.name}
                        </h4>
                        <p className="text-[10px] text-luxury-muted">{u.email}</p>
                        <div className="flex gap-3 text-[9px] text-luxury-muted uppercase mt-1">
                          <span>Bids: {u._count.bids}</span>
                          <span>Items: {u._count.items}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] text-luxury-muted font-medium">Reputation</p>
                          <p className={`text-xs font-bold ${
                            isSuspicious ? 'text-luxury-red' : 'text-luxury-gold'
                          }`}>
                            {Math.round(u.reputation)}/100
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded bg-luxury-surface text-luxury-muted hover:text-luxury-red hover:bg-luxury-red/15 transition-all"
                          title="Purge & Ban User"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// We also need to make sure we import Link properly on line 125
import Link from 'next/link';
