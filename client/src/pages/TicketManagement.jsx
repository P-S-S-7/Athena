import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TicketsList from "../components/tickets/TicketsList";
import { PlusIcon, ClipboardListIcon } from "lucide-react";
import { ToastContainer } from "../utils/toast";
import Sidebar from "../utils/Sidebar";
import Header from "../utils/Header";
import { useAuth } from '../contexts/AuthContext';
import ticketService from "@/services/ticketService";

const TicketManagement = () => {
    const [refresh, setRefresh] = useState(false);
    const [count, setCount] = useState(0);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchTicketCount = async () => {
            const val = await ticketService.getTicketCount();
            setCount(val.count);
        };
        fetchTicketCount();
    }, [refresh]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-grow">
                <Header
                    title="Ticket Management"
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />

                <main className="flex-grow p-6 overflow-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <Button onClick={() => navigate("/tickets/new")}>
                            <PlusIcon className="mr-2 h-4 w-4" /> New Ticket
                        </Button>

                        <div className="relative flex items-center">
                            <ClipboardListIcon className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                            {count > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {count}
                                </span>
                            )}
                        </div>
                    </div>

                    <Card className="p-4">
                        <TicketsList refreshTrigger={refresh} />
                    </Card>
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};

export default TicketManagement;
