'use client';

import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Landmark, AlertCircle } from 'lucide-react';

export default function Register() {
  const { register } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-xl border border-luxury-border/40">
        
        {/* Header */}
        <div className="text-center">
          <Landmark className="mx-auto h-12 w-12 text-luxury-gold" />
          <h2 className="mt-6 text-3xl font-extrabold font-display text-luxury-text">
            Join the Vault
          </h2>
          <p className="mt-2 text-xs text-luxury-muted">
            Create an account with default 100 reputation points
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-luxury-red/10 border border-luxury-red/30 p-4 flex items-center gap-3 text-xs text-luxury-red">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">
                Full Name
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg placeholder-luxury-muted/50 text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm transition-all"
                placeholder="James Bond"
              />
            </div>

            <div>
              <label htmlFor="email-address" className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg placeholder-luxury-muted/50 text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold tracking-wider uppercase text-luxury-muted">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-luxury-border bg-luxury-surface rounded-lg placeholder-luxury-muted/50 text-luxury-text focus:outline-none focus:ring-1 focus:ring-luxury-gold focus:border-luxury-gold text-sm transition-all"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold font-display rounded-lg text-luxury-bg bg-luxury-gold hover:bg-luxury-goldSoft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition-all duration-300 shadow-gold-glow disabled:opacity-50"
            >
              {loading ? 'CREATING PROFILE...' : 'REGISTER ACCOUNT'}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-luxury-border/30">
          <p className="text-xs text-luxury-muted">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-luxury-gold hover:text-luxury-goldSoft transition-colors">
              Access Account (Sign In)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
