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
import { useState, useRef, useEffect } from "react";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const dropdownRef = useRef(null);

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
            hasDropdown: true,
            dropdownItems: [
                {
                    name: "Contacts",
                    path: "/contacts"
                },
                {
                    name: "Companies",
                    path: "/companies"
                }
            ]
        },
        {
            name: "Solutions",
            icon: <BookOpen className="h-5 w-5" />,
        },
        {
            name: "Settings",
            icon: <Settings className="h-5 w-5" />,
        },
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setDropdownOpen(null);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="h-screen w-16 flex flex-col bg-slate-800 text-white shadow-lg">
            <div className="flex-1 flex flex-col items-center gap-1 py-4">
                {navItems.map((item) => (
                    item.hasDropdown && Array.isArray(item.dropdownItems) ? (
                        <div key={item.name} className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(dropdownOpen === item.name ? null : item.name)}
                                className={cn(
                                    "w-12 h-12 flex items-center justify-center transition-colors",
                                    item.dropdownItems.some(d => d.path === location.pathname)
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                                )}
                                aria-label={item.name}
                            >
                                {item.icon}
                            </button>

                            {dropdownOpen === item.name && (
                                <div className="absolute left-16 top-0 w-48 bg-slate-800 rounded-md shadow-lg z-10 py-2">
                                    {item.dropdownItems.map((dropdownItem, index) => (
                                        <div key={dropdownItem.name}>
                                            <button
                                                onClick={() => handleNavigation(dropdownItem.path)}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 flex items-center gap-2 transition-colors",
                                                    location.pathname === dropdownItem.path
                                                        ? "bg-slate-700 text-white"
                                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                                )}
                                            >
                                                <span>{dropdownItem.name}</span>
                                            </button>
                                            {index < item.dropdownItems.length - 1 && (
                                                <div className="mx-2 border-t border-slate-200" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <TooltipProvider key={item.name} delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => item.path && handleNavigation(item.path)}
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
                    )
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
