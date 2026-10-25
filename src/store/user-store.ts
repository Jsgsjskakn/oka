import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  setAuth: (userId: string, name: string, email: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  userId: null,
  userName: null,
  userEmail: null,
  setAuth: (userId, name, email) => set({ isAuthenticated: true, userId, userName: name, userEmail: email }),
  clearAuth: () => set({ isAuthenticated: false, userId: null, userName: null, userEmail: null }),
}));
