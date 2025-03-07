import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer, showSuccessToast } from '@/utils/toast';
import Sidebar from '../utils/Sidebar';
import Header from '../utils/Header';
import { useAuth } from '../contexts/AuthContext';

const AgentDashboard = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);

    const showWelcome = new URLSearchParams(location.search).get("welcome") === 'true';

    useEffect(() => {
        if (user) {
            setIsProfileLoaded(true);
        }
    }, [user]);

    useEffect(() => {
        if (isProfileLoaded && showWelcome) {
            const hasShownWelcome = sessionStorage.getItem('welcomeShown');

            if (!hasShownWelcome) {
                setTimeout(() => {
                    showSuccessToast(`Welcome, ${user.full_name || "Agent"}! You've successfully signed in.`);
                }, 500);

                sessionStorage.setItem('welcomeShown', 'true');

                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, [isProfileLoaded, showWelcome, user]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-grow">
                <Header
                    title="Agent Dashboard"
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />

                <main className="flex-grow p-6 overflow-auto">
                    <h2 className="text-xl font-bold">Welcome to the Agent Dashboard</h2>
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};

export default AgentDashboard;
