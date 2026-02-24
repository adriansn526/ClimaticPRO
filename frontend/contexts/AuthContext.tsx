'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    databaseId: number;
    name: string;
    email: string;
    roles: string[];
    capabilities?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isInstaller: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for stored session
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user data', e);
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        router.push('/cont/login');
    };

    const isInstaller = user?.roles.includes('installer') || user?.roles.includes('administrator') || false;
    const isSuperAdmin = user?.roles.includes('super_admin') || user?.roles.includes('administrator') || false;
    const isAdmin = user?.roles.includes('admin') || isSuperAdmin; // Admin includes Super Admin capabilities mostly

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user,
            isInstaller,
            isSuperAdmin,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
