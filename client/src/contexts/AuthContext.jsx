import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/profile`, {
                withCredentials: true
            });
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const validateAuth = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/users/validate_token`,
                { withCredentials: true }
            );

            if (response.data.valid) {
                await fetchUserProfile();
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Token validation failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
            setAuthInitialized(true);
        }
    };

    useEffect(() => {
        validateAuth();

        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    setUser(null);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const logout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/logout`, {}, {
                withCredentials: true
            });
            setUser(null);
            return true;
        } catch (error) {
            console.error("Logout failed:", error);
            setUser(null);
            return true;
        }
    };

    const value = {
        user,
        setUser,
        loading,
        fetchUserProfile,
        logout,
        isAuthenticated: !!user,
        authInitialized
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
