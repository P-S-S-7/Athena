import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CompaniesList from "../components/companies/CompaniesList";
import { PlusIcon, Building } from "lucide-react";
import { ToastContainer } from "@/utils/toast";
import Sidebar from "../utils/Sidebar";
import Header from "../utils/Header";
import { useAuth } from '../contexts/AuthContext';
import { ErrorProvider } from "../contexts/ErrorContext";

const CompanyManagementContent = () => {
    const [refresh, setRefresh] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleRefresh = () => {
        setRefresh(prev => !prev);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('refresh') === 'true') {
            setTimeout(() => {
                handleRefresh();
                navigate('/companies', { replace: true });
            }, 100);
        }
    }, [location.search, navigate, handleRefresh]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-grow">
                <Header
                    title="Company Management"
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />

                <main className="flex-grow p-6 overflow-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <Button onClick={() => navigate("/companies/new")}>
                            <PlusIcon className="mr-2 h-4 w-4" /> New Company
                        </Button>
                    </div>

                    <Card className="p-4">
                        <CompaniesList
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

const CompanyManagement = () => {
    return (
        <ErrorProvider>
            <CompanyManagementContent />
        </ErrorProvider>
    );
};

export default CompanyManagement;
