import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ContactsList from "../components/contacts/ContactsList";
import { PlusIcon, UserIcon } from "lucide-react";
import { ToastContainer } from "@/utils/toast";
import Sidebar from "../utils/Sidebar";
import Header from "../utils/Header";
import { useAuth } from '../contexts/AuthContext';
import contactService from "@/services/contactService";
import { ErrorProvider, useError } from "../contexts/ErrorContext";

const ContactManagementContent = () => {
    const [refresh, setRefresh] = useState(false);
    const [count, setCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();

    useEffect(() => {
        const fetchContactCount = async () => {
            try {
                const val = await contactService.getContactCount();
                setCount(val.count);
            } catch (error) {
                handleError(error);
                if (error.status === 401) {
                    navigate('/login');
                }
            }
        };
        fetchContactCount();
    }, [refresh, navigate, handleError]);

    const handleRefresh = () => {
        setRefresh(prev => !prev);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('refresh') === 'true') {
            setTimeout(() => {
                handleRefresh();
                navigate('/contacts', { replace: true });
            }, 100);
        }
    }, [location.search, navigate, handleRefresh]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-grow">
                <Header
                    title="Contact Management"
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />

                <main className="flex-grow p-6 overflow-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <Button onClick={() => navigate("/contacts/new")}>
                            <PlusIcon className="mr-2 h-4 w-4" /> New Contact
                        </Button>

                        <div className="relative flex items-center">
                            <UserIcon className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                            {count > 0 && (
                                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {count}
                                </span>
                            )}
                        </div>
                    </div>

                    <Card className="p-4">
                        <ContactsList
                            refreshTrigger={refresh}
                            onRefresh={handleRefresh}
                        />
                    </Card>
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};

const ContactManagement = () => {
    return (
        <ErrorProvider>
            <ContactManagementContent />
        </ErrorProvider>
    );
};

export default ContactManagement;
