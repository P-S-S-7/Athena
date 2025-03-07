import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    LayoutDashboard,
    Ticket,
    Users,
    BookOpen,
    BarChart3,
    Settings,
} from "lucide-react";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    if (!user) return null;

    const isAdmin = user.role === 'admin';

    const navItems = [
        {
            name: "Dashboard",
            icon: <LayoutDashboard className="h-5 w-5" />,
            path: isAdmin ? "/admin_dashboard" : "/agent_dashboard",
        },
        {
            name: "Tickets",
            icon: <Ticket className="h-5 w-5" />,
            path: "/tickets",
        },
        {
            name: "Contacts",
            icon: <Users className="h-5 w-5" />,
            path: "/contacts",
        },
        {
            name: "Solutions",
            icon: <BookOpen className="h-5 w-5" />,
            path: "/solutions",
        },
        {
            name: "Settings",
            icon: <Settings className="h-5 w-5" />,
            path: isAdmin ? "/admin_dashboard/settings" : "/agent_dashboard/settings",
        },
    ];

    if (isAdmin) {
        navItems.splice(4, 0, {
            name: "Analytics",
            icon: <BarChart3 className="h-5 w-5" />,
            path: "/analytics",
        });
    }

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="h-screen w-16 flex flex-col bg-slate-800 text-white shadow-lg">
            <div className="flex-1 flex flex-col items-center gap-1 py-4">
                {navItems.map((item) => (
                    <TooltipProvider key={item.name} delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleNavigation(item.path)}
                                    className={cn(
                                        "w-12 h-12 flex items-center justify-center rounded-md transition-colors",
                                        location.pathname === item.path
                                            ? "bg-slate-700 text-white"
                                            : "text-slate-400 hover:text-white hover:bg-slate-700"
                                    )}
                                    aria-label={item.name}
                                >
                                    {item.icon}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
                                {item.name}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>

            <div className="py-4 flex justify-center">
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white rounded-md transition-colors"
                                aria-label="Help and Support"
                            >
                                <span className="h-6 w-6 grid place-items-center bg-slate-700 text-white rounded-full hover:bg-slate-600">
                                    ?
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
                            Help & Support
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};

export default Sidebar;
