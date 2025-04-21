import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading, isAuthenticated, authInitialized } = useAuth();
    const location = useLocation();

    if (loading || !authInitialized) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-lg">Loading...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
            return <Navigate to="/admin_dashboard" replace />;
        } else if (user.role === 'agent') {
            return <Navigate to="/agent_dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
