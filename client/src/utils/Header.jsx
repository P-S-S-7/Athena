import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
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
    Users,
    RefreshCw,
    X,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import useLogout from '@/utils/logout';
import { useState, useEffect, useRef } from 'react';
import syncService from '@/services/syncService';
import ticketService from '@/services/ticketService';
import contactService from '@/services/contactService';
import { showSuccessToast, showErrorToast } from './toast';

const Header = ({ title }) => {
    const handleLogout = useLogout();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const defaultAvatarUrl = 'https://shorturl.at/SdLf2';

    const [searchType, setSearchType] = useState('tickets');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    if (!user) return null;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            setShowResults(true);

            try {
                if (searchType === 'tickets') {
                    const response = await ticketService.getTickets('created_at', 'desc', 1, 10, { search: searchQuery });
                    setSearchResults(response.tickets.map(ticket => ({
                        id: ticket.id,
                        title: ticket.subject || `Ticket #${ticket.id}`,
                        subtitle: `Status: ${formatTicketStatus(ticket.status)} | ID: ${ticket.id}`,
                        type: 'ticket'
                    })));
                } else {
                    const response = await contactService.getContacts('name', 'asc', 1, 10, { search: searchQuery });
                    setSearchResults(response.contacts.map(contact => ({
                        id: contact.id,
                        title: contact.name || 'Unnamed Contact',
                        subtitle: contact.email || contact.phone || 'No contact info',
                        type: 'contact'
                    })));
                }
            } catch (error) {
                console.error(`Error searching ${searchType}:`, error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, searchType]);

    const formatTicketStatus = (status) => {
        const statusMap = {
            2: 'Open',
            3: 'Pending',
            4: 'Resolved',
            5: 'Closed',
            6: 'Waiting on Customer',
            7: 'Waiting on Third Party'
        };
        return statusMap[status] || 'Unknown';
    };

    const handleSearchItemClick = (result) => {
        if (result.type === 'ticket') {
            navigate(`/tickets/${result.id}`);
        } else {
            navigate(`/contacts/${result.id}`);
        }
        setSearchQuery('');
        setShowResults(false);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    const getNewMenuItems = () => {
        const items = [
            { icon: <Ticket className="h-4 w-4 mr-2" />, label: "Ticket", path: "/tickets/new" },
            { icon: <User className="h-4 w-4 mr-2" />, label: "Contact", path: "/contacts/new" },
        ];
        if (user.role === 'admin') {
            items.push({ icon: <Users className="h-4 w-4 mr-2" />, label: "Agent", path: "/agents/new" });
        }
        return items;
    };

    const handleSync = async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            const result = await syncService.syncAll();
            showSuccessToast("Sync Successful", { autoClose: 3000 });
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            showErrorToast("Sync Failed", { autoClose: 3000 });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

                <div className="flex items-center space-x-4">
                    <div ref={searchRef} className="relative">
                        <div className="flex items-center border rounded-md px-2 shadow-md bg-background">
                            <Search className="h-4 w-4 text-muted-foreground mr-2" />
                            <Input
                                type="search"
                                placeholder={`Search ${searchType}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
                                className="w-[200px] md:w-[300px] border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                            />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                        {searchType === 'tickets' ? 'Tickets' : 'Contacts'}
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[150px]">
                                    <DropdownMenuRadioGroup value={searchType} onValueChange={setSearchType}>
                                        <DropdownMenuRadioItem value="tickets">
                                            <Ticket className="h-4 w-4 mr-2" /> Tickets
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="contacts">
                                            <User className="h-4 w-4 mr-2" /> Contacts
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={handleClearSearch}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {showResults && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-lg rounded-md border overflow-hidden z-50">
                                {isSearching ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                        Searching...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {searchResults.map((result) => (
                                            <div
                                                key={`${result.type}-${result.id}`}
                                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                                onClick={() => handleSearchItemClick(result)}
                                            >
                                                <div className="flex items-start">
                                                    {result.type === 'ticket' ? (
                                                        <Ticket className="h-4 w-4 mt-0.5 mr-2 shrink-0 text-muted-foreground" />
                                                    ) : (
                                                        <User className="h-4 w-4 mt-0.5 mr-2 shrink-0 text-muted-foreground" />
                                                    )}
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-medium truncate">{result.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchQuery.trim().length >= 2 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No results found
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {user.role === 'admin' && (
                        <Button
                            variant="outline"
                            size="icon"
                            title="Sync data with Freshdesk"
                            onClick={handleSync}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                    )}

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
