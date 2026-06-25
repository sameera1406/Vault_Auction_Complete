'use client';

import Link from 'next/link';
import { useStore } from '../store/useStore';
import { useEffect } from 'react';
import { Shield, Trophy, User, LogOut, LayoutDashboard, Landmark } from 'lucide-react';

export default function Navbar() {
  const { user, token, initAuth, logout, connectSocket } = useStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (token) {
      connectSocket();
    }
  }, [token, connectSocket]);

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-luxury-border/40 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Landmark className="w-6 h-6 text-luxury-gold transition-transform group-hover:scale-105" />
          <span className="font-display font-bold text-xl tracking-wider text-luxury-text hover:text-luxury-gold transition-colors">
            VAULT<span className="font-light text-luxury-gold">AUCTION</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium tracking-wide text-luxury-muted hover:text-luxury-text transition-colors">
            Rooms
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-luxury-muted hover:text-luxury-text transition-colors">
            <Trophy className="w-4 h-4 text-luxury-gold" />
            Leaderboard
          </Link>

          {user && (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-luxury-muted hover:text-luxury-text transition-colors">
              <LayoutDashboard className="w-4 h-4 text-luxury-gold" />
              Dashboard
            </Link>
          )}

          {user && user.role === 'ADMIN' && (
            <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-luxury-red hover:text-red-400 transition-colors">
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </div>

        {/* Auth details & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Reputation Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-xs font-semibold tracking-wider text-luxury-gold">
                <span>REP:</span>
                <span className="gold-glow-text font-bold">{Math.round(user.reputation)}</span>
              </div>

              {/* User Identity */}
              <div className="flex items-center gap-2 text-sm text-luxury-text font-medium border-l border-luxury-border/60 pl-4">
                <User className="w-4 h-4 text-luxury-muted" />
                <span className="hidden sm:inline">{user.name}</span>
              </div>

              {/* Logout */}
              <button 
                onClick={logout}
                className="p-2 rounded-lg text-luxury-muted hover:text-luxury-red hover:bg-luxury-red/10 transition-all"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-xs font-semibold tracking-wider text-luxury-muted hover:text-luxury-text transition-colors px-3 py-2"
              >
                SIGN IN
              </Link>
              <Link 
                href="/register" 
                className="text-xs font-semibold tracking-wider text-luxury-bg bg-luxury-gold hover:bg-luxury-goldSoft px-4 py-2 rounded-md transition-all font-display duration-300"
              >
                JOIN THE VAULT
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
