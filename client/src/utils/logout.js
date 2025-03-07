import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const useLogout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            sessionStorage.removeItem('welcomeShown');
            localStorage.removeItem('welcomeShown');

            navigate('/login?status=logout', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login');
        }
    };

    return handleLogout;
};

export default useLogout;
