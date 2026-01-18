import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  wallet_address: string;
  referral_code: string;
  points: number;
  shadow_commitment: string | null;
  referred_by: string | null;
}

interface AuthState {
  user: User | null;
  isRegistered: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isRegistered: false,
      isLoading: false,
      setUser: (user) => set({ user, isRegistered: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isRegistered: false }),
    }),
    {
      name: 'loopy-auth',
      partialize: (state) => ({ user: state.user, isRegistered: state.isRegistered }),
    }
  )
);
