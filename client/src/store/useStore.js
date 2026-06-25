import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${SOCKET_URL}${path}`;
};

export const useStore = create((set, get) => ({
  // Auth State
  user: null,
  token: null,
  authLoading: true,

  // UI Queue States
  liveNow: null,
  upNext: null,
  upcoming: [],
  queueLoading: false,

  // Active Auction Room State
  activeAuction: null,
  activeBids: [],
  activeViewers: 0,
  activeBidders: 0,
  activeCountdown: null, // remaining seconds
  roomLoading: false,

  // Socket instance
  socket: null,

  // Dashboard Stats
  sales: [],
  purchases: [],
  dashboardLoading: false,

  // Leaderboard
  leaderboard: [],
  leaderboardLoading: false,

  // Admin Panel Data
  adminStats: null,
  adminAuctions: [],
  adminUsers: [],
  adminLoading: false,

  // Set Auth loading completed on mount
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vault_token');
      const userStr = localStorage.getItem('vault_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) });
      }
    }
    set({ authLoading: false });
  },

  // Auth Operations
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      
      set({ token: data.token, user: data.user });
      
      // Re-initialize socket with new token
      get().connectSocket();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));

      set({ token: data.token, user: data.user });
      get().connectSocket();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    
    set({ token: null, user: null, socket: null });
  },

  // WebSocket Connection
  connectSocket: () => {
    const { socket: existingSocket, token } = get();
    if (existingSocket) {
      existingSocket.disconnect();
    }

    const socketOptions = token 
      ? { auth: { token } }
      : {};

    const newSocket = io(SOCKET_URL, socketOptions);

    // Global Queue Sync
    newSocket.on('auction:update', (data) => {
      console.log('[Socket Global] Queue updated:', data);
      get().fetchQueue();
    });

    set({ socket: newSocket });
  },

  // Queue Operations
  fetchQueue: async () => {
    set({ queueLoading: true });
    try {
      const res = await fetch(`${API_BASE}/items/queue`);
      const data = await res.json();
      if (res.ok) {
        set({
          liveNow: data.liveNow,
          upNext: data.upNext,
          upcoming: data.upcoming || []
        });
      }
    } catch (error) {
      console.error('Fetch queue failed:', error);
    } finally {
      set({ queueLoading: false });
    }
  },

  // Active Auction Room Actions
  joinAuctionRoom: async (auctionId) => {
    set({ roomLoading: true, activeAuction: null, activeBids: [], activeCountdown: null });
    
    try {
      // 1. Fetch details from API
      const res = await fetch(`${API_BASE}/items/details/${auctionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      set({
        activeAuction: data,
        activeBids: data.bids || []
      });

      // 2. Connect socket if not connected
      let { socket } = get();
      if (!socket) {
        get().connectSocket();
        socket = get().socket;
      }

      // 3. Emit room join event
      socket.emit('auction:join', { auctionId });

      // 4. Setup room specific socket listeners
      socket.on('auction:tick', ({ remainingSeconds }) => {
        set({ activeCountdown: remainingSeconds });
      });

      socket.on('user:watching', ({ viewers, bidders }) => {
        set({ activeViewers: viewers, activeBidders: bidders });
      });

      socket.on('bid:update', ({ highestBid, bidHistory }) => {
        set((state) => {
          // Play micro-animations or notify
          const updatedAuction = state.activeAuction 
            ? { ...state.activeAuction, currentHighestBid: highestBid.amount } 
            : null;
          return {
            activeBids: bidHistory,
            activeAuction: updatedAuction
          };
        });
      });

      socket.on('auction:end', ({ status, winner, amount }) => {
        set((state) => {
          if (state.activeAuction) {
            return {
              activeAuction: { ...state.activeAuction, status: 'ENDED' }
            };
          }
          return {};
        });
      });

      socket.on('auction:start', ({ status, endTime }) => {
        set((state) => {
          if (state.activeAuction) {
            return {
              activeAuction: { ...state.activeAuction, status: 'LIVE', endTime }
            };
          }
          return {};
        });
      });

    } catch (error) {
      console.error('Join room failed:', error);
    } finally {
      set({ roomLoading: false });
    }
  },

  leaveAuctionRoom: (auctionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('auction:leave', { auctionId });
      socket.off('auction:tick');
      socket.off('user:watching');
      socket.off('bid:update');
      socket.off('auction:end');
      socket.off('auction:start');
    }
    set({
      activeAuction: null,
      activeBids: [],
      activeViewers: 0,
      activeBidders: 0,
      activeCountdown: null
    });
  },

  placeBid: async (amount) => {
    const { activeAuction, token } = get();
    if (!activeAuction || !token) return { success: false, error: 'Unauthorized' };

    try {
      const res = await fetch(`${API_BASE}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          auctionId: activeAuction.id,
          amount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Submit Listing
  submitItem: async (formData, onProgress) => {
    const { token } = get();
    if (!token) return { success: false, error: 'Unauthorized' };

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/items`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, auctionId: data.auction?.id });
          } else {
            resolve({ success: false, error: data.message || 'Failed to submit listing' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse server response' });
        }
      };

      xhr.onerror = () => {
        resolve({ success: false, error: 'Network connection failed' });
      };

      if (formData instanceof FormData) {
        xhr.send(formData);
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(formData));
      }
    });
  },

  // User Dashboard Operations
  fetchDashboardData: async () => {
    const { token } = get();
    if (!token) return;

    set({ dashboardLoading: true });
    try {
      const res = await fetch(`${API_BASE}/transactions/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        set({ sales: data.sales, purchases: data.purchases });
      }
    } catch (error) {
      console.error('Fetch dashboard failed:', error);
    } finally {
      set({ dashboardLoading: false });
    }
  },

  sellerAcceptBid: async (transactionId) => {
    const { token } = get();
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_BASE}/transactions/seller/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      get().fetchDashboardData();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  sellerRejectBid: async (transactionId) => {
    const { token } = get();
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_BASE}/transactions/seller/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      get().fetchDashboardData();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  buyerConfirmDeal: async (transactionId) => {
    const { token } = get();
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_BASE}/transactions/buyer/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Update profile rep too
      get().fetchDashboardData();
      get().refreshProfile();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  buyerRefuseDeal: async (transactionId) => {
    const { token } = get();
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_BASE}/transactions/buyer/refuse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      get().fetchDashboardData();
      get().refreshProfile();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('vault_user', JSON.stringify(data));
        set({ user: data });
      }
    } catch (error) {
      console.error('Refresh profile failed:', error);
    }
  },

  // Leaderboard
  fetchLeaderboard: async () => {
    set({ leaderboardLoading: true });
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      const data = await res.json();
      if (res.ok) {
        set({ leaderboard: data });
      }
    } catch (error) {
      console.error('Fetch leaderboard failed:', error);
    } finally {
      set({ leaderboardLoading: false });
    }
  },

  // Admin Dashboard operations
  fetchAdminData: async () => {
    const { token } = get();
    if (!token) return;

    set({ adminLoading: true });
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        set({
          adminStats: data.stats,
          adminAuctions: data.auctions,
          adminUsers: data.users
        });
      }
    } catch (error) {
      console.error('Fetch admin data failed:', error);
    } finally {
      set({ adminLoading: false });
    }
  },

  adminDeleteAuction: async (auctionId) => {
    const { token } = get();
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_BASE}/admin/auction/${auctionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      get().fetchAdminData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  adminDeleteUser: async (userId) => {
    const { token } = get();
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_BASE}/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      get().fetchAdminData();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}));
