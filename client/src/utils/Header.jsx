import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    LogOut,
    ChevronDown,
    Plus,
    Search,
    Bell,
    Ticket,
    Mail,
    User,
    Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import useLogout from '@/utils/logout';

const Header = ({ title }) => {
    const handleLogout = useLogout();
    const navigate = useNavigate();
    const { user } = useAuth();
    const defaultAvatarUrl = 'https://shorturl.at/SdLf2';

    if (!user) return null;

    const getNewMenuItems = () => {
        const items = [
            { icon: <Ticket className="h-4 w-4 mr-2" />, label: "Ticket", path: "/tickets/new" },
            { icon: <Mail className="h-4 w-4 mr-2" />, label: "Email", path: "/emails/new" },
            { icon: <User className="h-4 w-4 mr-2" />, label: "Contact", path: "/contacts/new" },
        ];
        if (user.role === 'admin') {
            items.push({ icon: <Users className="h-4 w-4 mr-2" />, label: "Agent", path: "/agents/new" });
        }
        return items;
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

                <div className="flex items-center space-x-4">
                    <div className="relative flex items-center border rounded-md px-2 shadow-md bg-background">
                        <Search className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-[200px] md:w-[300px] border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="flex items-center gap-1">
                                <Plus className="h-4 w-4" />
                                <span>New</span>
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {getNewMenuItems().map((item, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    className="cursor-pointer py-2 flex items-center"
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" title="Notifications">
                        <Bell className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10 border border-muted">
                                    <AvatarImage src={defaultAvatarUrl} alt={user.full_name} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : '@'}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="h-4 w-4 absolute bottom-0 right-0 bg-background rounded-full p-0.5 border" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-64" align="end">
                            <div className="flex items-center p-3 pb-2 gap-3">
                                <Avatar className="h-10 w-10 border border-muted">
                                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : '@'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col space-y-0.5">
                                    <p className="text-sm font-medium line-clamp-1">{user.full_name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{user.email}</p>
                                </div>
                            </div>
                            <div className="px-3 pb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
            </div>
        </header>
    );
};

export default Header;
