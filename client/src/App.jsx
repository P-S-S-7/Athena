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
import CompanyManagement from './pages/CompanyManagement';
import { ErrorProvider } from './contexts/ErrorContext';
import { ToastContainer } from './utils/toast';
import { DataProvider } from './contexts/DataContext';
import CompanyCreate from './components/companies/CompanyCreate';
import CompanyDetails from './components/companies/CompanyDetails';
import AnimatedLayout from './components/layout/AnimatedLayout';

function App() {
    return (
        <AuthProvider>
            <DataProvider>
                <ErrorProvider>
                    <Router>
                        <ToastContainer />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/admin_dashboard" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AnimatedLayout>
                                        <AdminDashboard />
                                    </AnimatedLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/agent_dashboard" element={
                                <ProtectedRoute allowedRoles={['agent']}>
                                    <AnimatedLayout>
                                        <AgentDashboard />
                                    </AnimatedLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/tickets" element={
                                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                    <AnimatedLayout>
                                        <TicketManagement />
                                    </AnimatedLayout>
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
                                    <AnimatedLayout>
                                        <ContactManagement />
                                    </AnimatedLayout>
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
                            <Route path="/companies" element={
                                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                    <AnimatedLayout>
                                        <CompanyManagement />
                                    </AnimatedLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/companies/new" element={
                                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                    <CompanyCreate />
                                </ProtectedRoute>
                            } />
                            <Route path="/companies/:companyId" element={
                                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                    <CompanyDetails/>
                                </ProtectedRoute>
                            } />
                            <Route path="/companies/:companyId/edit" element={
                                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                                    <CompanyCreate />
                                </ProtectedRoute>
                            } />
                            <Route path="/" element={<Navigate to="/login" />} />
                        </Routes>
                    </Router>
                </ErrorProvider>
            </DataProvider>
        </AuthProvider>
    );
}

export default App;
