import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import TicketManagement from './pages/TicketManagement';
import TicketCreate from './components/tickets/TicketCreate';
import TicketDetails from './components/tickets/TicketDetails';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin_dashboard" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/agent_dashboard" element={
                        <ProtectedRoute allowedRoles={['agent']}>
                            <AgentDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/tickets" element={
                        <ProtectedRoute allowedRoles={['admin', 'agent']}>
                            <TicketManagement />
                        </ProtectedRoute>
                    } />
                    <Route path="/tickets/new" element={
                        <ProtectedRoute allowedRoles={['admin', 'agent']}>
                            <TicketCreate />
                        </ProtectedRoute>
                    } />
                    <Route path="/tickets/:ticketId" element={
                        <ProtectedRoute allowedRoles={['admin', 'agent']}>
                            <TicketDetails />
                        </ProtectedRoute>
                    } />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
