import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLogout from '@/utils/logout';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronDown, Home } from 'lucide-react';

const AgentDashboard = () => {
    const navigate = useNavigate();
    const handleLogout = useLogout();
    const [userRole, setUserRole] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userAvatarUrl, setUserAvatarUrl] = useState('');

    useEffect(() => {
        const getCookie = (name) => {
            const value = document.cookie
                .split('; ')
                .find(row => row.startsWith(`${name}=`))
                ?.split('=')[1];
            return value ? decodeURIComponent(value) : '';
        };

        const role = getCookie('user_role');
        const email = getCookie('user_email');
        const fullName = getCookie('user_full_name').replace(/\+/g, ' ');
        const avatarUrl = getCookie('user_avatar_url');

        if (!role || role !== 'agent') {
            navigate('/login');
        } else {
            setUserRole(role);
            setUserEmail(email);
            setUserFullName(fullName);
            setUserAvatarUrl(avatarUrl);
        }
    }, [navigate]);

    const defaultAvatarUrl = 'https://shorturl.at/SdLf2';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <Home className="h-6 w-6" />
                        <h1 className="text-xl font-semibold tracking-tight">Agent Dashboard</h1>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10 border border-muted">
                                    <AvatarImage 
                                    src={defaultAvatarUrl} 
                                    alt={userFullName}
                                />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {userFullName ? userFullName.charAt(0).toUpperCase() : '@'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="h-4 w-4 absolute bottom-0 right-0 bg-background rounded-full p-0.5 border" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-64" align="end">
                                <div className="flex items-center p-3 pb-2 gap-3">
                                    <Avatar className="h-10 w-10 border border-muted">
                                        <AvatarImage 
                                        src={userAvatarUrl} 
                                        alt={userFullName}
                                    />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {userFullName ? userFullName.charAt(0).toUpperCase() : '@'}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-sm font-medium line-clamp-1">{userFullName}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{userEmail}</p>
                                        </div>
                                    </div>

                                    <div className="px-3 pb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                                        </span>
                                    </div>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem 
                                    className="cursor-pointer py-2.5 px-3 gap-2 text-destructive focus:text-destructive"
                                    onClick={handleLogout}
                                    >
                                    <LogOut className="h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
            </div>
    );
};

export default AgentDashboard;
