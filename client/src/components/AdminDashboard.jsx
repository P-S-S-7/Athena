import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_role='))
      ?.split('=')[1];

    const emailCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_email='))
      ?.split('=')[1];

    if (!roleCookie || decodeURIComponent(roleCookie) !== 'admin') {
      navigate('/login');
    } else {
      setUserRole(decodeURIComponent(roleCookie));
      setUserEmail(decodeURIComponent(emailCookie || ''));
    }
  }, [navigate]);

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

  const getProfileLetter = (email) => {
    if (!email) return '@'; 
    const firstLetter = email.match(/[A-Za-z]/)?.[0] || 'A';
    return firstLetter.toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)} 
            className="flex items-center space-x-2 focus:outline-none"
          >
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gray-700 text-white font-bold">
              {getProfileLetter(userEmail)}
              </AvatarFallback>
            </Avatar>
            <ChevronDown 
              className={`w-5 h-5 transition-transform duration-300 ${
                dropdownOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 min-w-[200px] max-w-[260px] bg-white text-gray-900 shadow-lg rounded-lg border border-gray-300 py-4 px-5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                <p className="text-sm font-medium truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>

              <div className="flex items-center space-x-2 mt-1">
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                <p className="text-sm font-medium text-gray-500">{userRole}</p>
              </div>

              <hr className="my-3 border-gray-300" />

              <Button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md w-full"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default AdminDashboard;