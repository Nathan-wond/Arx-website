import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.js';
import { authState, events } from '../vanilla/state.js';

export interface Member {
  id: string;
  memberId: string;
  studentName: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  class?: string;
  role: 'member' | 'admin' | 'president';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  phoneNumber?: string;
  email?: string;
  telegramUsername?: string;
  award?: string;
  motivationEssay?: string;
  enrolledCourses?: string[];
  attendance?: { totalSessions: number; attendedSessions: number; percentage: number };
  joinedAt?: string;
  createdAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  member: Member | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPresident: boolean;
  isLowerAdmin: boolean;
  login: (memberId: string, password: string) => Promise<{ success: boolean; member: Member }>;
  adminLogin: (memberId: string, password: string) => Promise<{ success: boolean; member: Member; redirectUrl?: string }>;
  register: (params: any) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<Member | null>;
  updateMemberState: (updated: Member) => void;
}

const AuthContext = createContext<AuthContextType>({
  member: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isPresident: false,
  isLowerAdmin: false,
  login: async () => ({ success: false, member: null as any }),
  adminLogin: async () => ({ success: false, member: null as any }),
  register: async () => ({}),
  logout: () => {},
  refreshProfile: async () => null,
  updateMemberState: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [member, setMemberState] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setMember = useCallback((m: Member | null) => {
    setMemberState(m);
    (authState as any).member = m;
    events.emit('authChange', authState);
  }, []);

  const refreshProfile = useCallback(async (): Promise<Member | null> => {
    const token = getStoredToken();
    if (!token) {
      setMember(null);
      setIsLoading(false);
      return null;
    }
    try {
      const response = await api.getMe();
      if (response && response.member) {
        setMember(response.member);
        return response.member;
      } else {
        clearStoredToken();
        setMember(null);
        return null;
      }
    } catch {
      clearStoredToken();
      setMember(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setMember]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (memberId: string, password: string) => {
    const res = await api.login({ memberId, password });
    if (!res.token) throw new Error('Authentication failed: server did not return a session token.');
    setStoredToken(res.token);
    setMember(res.member);
    return { success: true, member: res.member };
  };

  const adminLogin = async (memberId: string, password: string) => {
    const res = await api.adminLogin({ memberId, password });
    if (!res.token) throw new Error('Admin authentication failed: server did not return a session token.');
    setStoredToken(res.token);
    setMember(res.member);
    return { success: true, member: res.member, redirectUrl: res.redirectUrl };
  };

  const register = async (params: any) => {
    const res = await api.register(params);
    if (res.token) {
      setStoredToken(res.token);
      setMember(res.member);
    }
    return {
      success: true,
      memberId: res.memberId,
      member: res.member,
      course: res.course,
      enrollment: res.enrollment,
      activationUrl: res.activationUrl || (res.activation ? res.activation.activationUrl : undefined),
      activationToken: res.activationToken || (res.activation ? res.activation.token : undefined),
      activationCode: res.activationCode || (res.activation ? res.activation.activationCode : undefined),
      telegramBotUsername: res.telegramBotUsername || 'ARXITCLUB_bot',
      telegramBotUrl: res.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
      telegramChannelUrl: res.telegramChannelUrl || 'https://t.me/arxitclub',
      telegramChannelName: res.telegramChannelName || '@arxitclub'
    };
  };

  const logout = () => {
    try {
      api.logout();
    } catch {}
    clearStoredToken();
    setMember(null);
  };

  const updateMemberState = (updated: Member) => {
    setMember(updated);
  };

  const isAuthenticated = !!member;
  const isAdmin = member?.role === 'admin' || member?.role === 'president';
  const isPresident = member?.role === 'president';
  const isLowerAdmin = member?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        member,
        isLoading,
        isAuthenticated,
        isAdmin,
        isPresident,
        isLowerAdmin,
        login,
        adminLogin,
        register,
        logout,
        refreshProfile,
        updateMemberState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
