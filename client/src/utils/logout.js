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
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return handleLogout;
};

export default useLogout;
