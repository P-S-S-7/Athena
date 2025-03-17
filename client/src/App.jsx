import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import TicketManagement from './pages/TicketManagement';
import TicketCreate from './components/tickets/TicketCreate';
import TicketDetails from './components/tickets/TicketDetails';
import ContactManagement from './pages/ContactManagement';
import ContactCreate from './components/contacts/ContactCreate';
import ContactDetails from './components/contacts/ContactDetails';
import { ErrorProvider } from './contexts/ErrorContext';
import { ToastContainer } from './utils/toast';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ErrorProvider>
                    <ToastContainer />
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
                        <Route path="/contacts" element={
                            <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                <ContactManagement />
                            </ProtectedRoute>
                        } />
                        <Route path="/contacts/new" element={
                            <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                <ContactCreate />
                            </ProtectedRoute>
                        } />
                        <Route path="/contacts/:contactId" element={
                            <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                <ContactDetails />
                            </ProtectedRoute>
                        } />
                        <Route path="/contacts/:contactId/edit" element={
                            <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                <ContactCreate />
                            </ProtectedRoute>
                        } />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </ErrorProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
