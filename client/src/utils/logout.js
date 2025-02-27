import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const useLogout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/logout`,
                {},
                { withCredentials: true }
            );
            localStorage.removeItem('welcomeShown');
            navigate('/login?status=logout');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return handleLogout;
};

export default useLogout;
