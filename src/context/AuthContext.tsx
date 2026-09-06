import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoUsers: User[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  // Load initial session & demo users
  useEffect(() => {
    async function init() {
      try {
        const demos = await api.getDemoUsers();
        setDemoUsers(demos);

        const savedUserId = localStorage.getItem('vericert_user_id');
        if (savedUserId) {
          const found = demos.find(u => u.id === savedUserId);
          if (found) {
            setUser(found);
          } else {
            const fetched = await api.getMe(savedUserId);
            setUser(fetched);
          }
        } else {
          // Default to student Ramya Krishnan (or first student)
          const defaultStudent = demos.find(u => u.email.includes('ramya')) || demos.find(u => u.role === 'student') || demos[0];
          if (defaultStudent) {
            setUser(defaultStudent);
            localStorage.setItem('vericert_user_id', defaultStudent.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize user', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    localStorage.setItem('vericert_user_id', res.user.id);
  };

  const register = async (data: Partial<User> & { password: string }) => {
    const res = await api.register(data);
    setUser(res.user);
    localStorage.setItem('vericert_user_id', res.user.id);
    // Refresh demo users list to include the newly registered student
    const demos = await api.getDemoUsers();
    setDemoUsers(demos);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vericert_user_id');
  };

  const switchUser = (targetUser: User) => {
    setUser(targetUser);
    localStorage.setItem('vericert_user_id', targetUser.id);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const updated = await api.getMe(user.id);
      setUser(updated);
      const demos = await api.getDemoUsers();
      setDemoUsers(demos);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoUsers,
        login,
        register,
        logout,
        switchUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
