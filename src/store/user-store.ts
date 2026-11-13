import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  setAuth: (userId: string, name: string, email: string, phone?: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  userId: null,
  userName: null,
  userEmail: null,
  userPhone: null,
  setAuth: (userId, name, email, phone = null) =>
    set({
      isAuthenticated: true,
      userId,
      userName: name,
      userEmail: email,
      userPhone: phone ?? null,
    }),
  clearAuth: () =>
    set({
      isAuthenticated: false,
      userId: null,
      userName: null,
      userEmail: null,
      userPhone: null,
    }),
}));
