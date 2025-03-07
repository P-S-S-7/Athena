import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ticketService from '@/services/ticketService';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import {
    Reply, FileText, Forward, Check,
    Merge, Trash2, BarChart, Globe, Ticket, Download, PaperclipIcon,
    Mail, Phone, MessageSquare, X, UserCircle, MessageCircle, Bot,
    Settings, ShoppingCart, MessagesSquare, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showErrorToast, showSuccessToast, ToastContainer } from '@/utils/toast';
import { sourceMap, contactMap, contactEmailMap, agentMap } from '@/utils/freshdeskMappings';
import Sidebar from '@/utils/Sidebar';
import Header from '@/utils/Header';
import TicketConversations from './ticketDetailComponents/TicketConversations';
import AddReply from './ticketDetailComponents/AddReply';
import AddNote from './ticketDetailComponents/AddNote';
import ForwardTicket from './ticketDetailComponents/ForwardTicket';
import TicketProperties from './ticketDetailComponents/TicketProperties';

const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Invalid date';
    }
};

const getSourceIcon = (source) => {
    switch (source) {
        case 1: return <Mail className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 2: return <Globe className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 3: return <Phone className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 4: return <MessageSquare className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 5: return <X className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 6: return <UserCircle className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 7: return <MessageCircle className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 8: return <Settings className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 9: return <MessageSquare className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 10: return <ArrowLeft className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 11: return <ShoppingCart className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 12: return <Bot className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 13: return <MessagesSquare className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        case 14: return <MessageCircle className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
        default: return <Ticket className="h-4 w-4 text-gray-600 flex-shrink-0 ml-2" />;
    }
};

const getLargeSourceIcon = (source) => {
    switch (source) {
        case 1: return <Mail className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 2: return <Globe className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 3: return <Phone className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 4: return <MessageSquare className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 5: return <X className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 6: return <UserCircle className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 7: return <MessageCircle className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 8: return <Settings className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 9: return <MessageSquare className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 10: return <ArrowLeft className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 11: return <ShoppingCart className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 12: return <Bot className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 13: return <MessagesSquare className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        case 14: return <MessageCircle className="h-8 w-8 text-gray-600 flex-shrink-0" />;
        default: return <Ticket className="h-8 w-8 text-gray-600 flex-shrink-0" />;
    }
};

const TicketDetails = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const actionFormRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [replyType, setReplyType] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshData = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };

    useEffect(() => {
        const fetchTicketData = async () => {
            try {
                setLoading(true);
                setError(null);
                const ticketData = await ticketService.getTicket(ticketId);

                if (!ticketData) {
                    setError('Ticket not found');
                    setLoading(false);
                    return;
                }

                setTicket(ticketData.ticket);

                try {
                    const conversationsData = await ticketService.getTicketConversations(ticketId);
                    if (conversationsData && conversationsData.conversations) {
                        setConversations(conversationsData.conversations);
                    } else {
                        setConversations([]);
                    }
                } catch (convError) {
                    console.error('Error fetching conversations:', convError);
                    setConversations([]);
                }

            } catch (error) {
                console.error('Error fetching ticket details:', error);
                setError('Failed to load ticket details');
                showErrorToast('Failed to load ticket details');
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();
    }, [ticketId, refreshKey]);

    useEffect(() => {
        if (replyType && actionFormRef.current) {
            actionFormRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [replyType]);

    useEffect(() => {
        const addStylesToLinks = () => {
            const links = document.querySelectorAll('.ticket-description a, .conversation-body a');
            links.forEach(link => {
                link.style.color = '#2563eb';
                link.style.textDecoration = 'underline';
                link.style.fontStyle = 'italic';
            });
        };

        if (ticket) {
            setTimeout(addStylesToLinks, 100);
        }
    }, [ticket, conversations]);

    const handleTicketAction = async (action) => {
        try {
            setIsUpdating(true);

            switch (action) {
                case 'close':
                    await ticketService.updateTicket(ticketId, { status: 5 });
                    showSuccessToast('Ticket closed successfully');
                    refreshData();
                    break;

                case 'delete':
                    if (window.confirm('Are you sure you want to delete this ticket?')) {
                        await ticketService.deleteTicket(ticketId);
                        showSuccessToast('Ticket deleted successfully');
                        navigate('/tickets');
                        return;
                    }
                    break;

                case 'merge':
                    showErrorToast('Merge functionality not implemented yet');
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
            showErrorToast(`Failed to ${action} ticket`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleReplyClick = (type) => {
        setReplyType(type);
        setTimeout(() => {
            if (actionFormRef.current) {
                actionFormRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                    <Header title={`Loading Ticket #${ticketId}`} />
                    <main className="flex-grow p-6 overflow-auto">
                        <div className="flex items-center justify-center h-full">
                            <div className="text-lg font-medium">Loading ticket details...</div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                    <Header title="Ticket Not Found" />
                    <main className="flex-grow p-6 overflow-auto">
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-lg font-medium mb-4">
                                {error || "Ticket not found or you do not have permission to view it"}
                            </div>
                            <Button onClick={() => navigate('/tickets')}>Return to Tickets</Button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const isTicketClosed = ticket.status === 5;

    const renderActionComponent = () => {
        switch (replyType) {
            case 'reply':
                return <AddReply
                    ticketId={ticketId}
                    onSuccess={() => {
                        refreshData();
                        setReplyType(null);
                    }}
                />;
            case 'note':
                return <AddNote
                    ticketId={ticketId}
                    onSuccess={() => {
                        refreshData();
                        setReplyType(null);
                    }}
                />;
            case 'forward':
                return <ForwardTicket
                    ticketId={ticketId}
                    ticket={ticket}
                    onSuccess={() => {
                        refreshData();
                        setReplyType(null);
                    }}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-grow">
                <Header title={`Ticket #${ticket.id}`} />
                <main className="flex-grow p-6 overflow-auto">
                    <ToastContainer />
                    <div className="mb-4 flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-blue-500 border-blue-500 hover:bg-blue-50"
                            onClick={() => navigate('/tickets')}
                        >
                            <Ticket className="h-4 w-4" /> All Tickets
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleReplyClick('reply')}
                            disabled={isTicketClosed}
                        >
                            <Reply className="h-4 w-4" /> Reply
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleReplyClick('note')}
                        >
                            <FileText className="h-4 w-4" /> Note
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleReplyClick('forward')}
                            disabled={isTicketClosed}
                        >
                            <Forward className="h-4 w-4" /> Forward
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleTicketAction('close')}
                            disabled={isTicketClosed || isUpdating}
                        >
                            <Check className="h-4 w-4" /> Close
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleTicketAction('merge')}
                            disabled={isUpdating || isTicketClosed}
                        >
                            <Merge className="h-4 w-4" /> Merge
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-500 hover:bg-red-50"
                            onClick={() => handleTicketAction('delete')}
                            disabled={isUpdating}
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 ml-auto"
                            disabled={isUpdating}
                        >
                            <BarChart className="h-4 w-4" /> Show Activities
                        </Button>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex gap-4">
                        <div className="flex-grow">
                            <Card className="p-4 mb-4">
                                <div className="flex items-center">
                                    {getLargeSourceIcon(ticket.source)}
                                    <h1 className="text-xl font-medium ml-3">{ticket.subject}</h1>
                                </div>
                                {ticket.responder_id &&(sourceMap[ticket.source] === 'Portal' || sourceMap[ticket.source] === 'Phone') && (
                                    <h3 className="text-sm text-gray-600 ml-12 -mt-6 -mb-4">
                                        Created by {ticket.responder_id && <span className="text-gray-800 font-medium">{agentMap[ticket.responder_id] || "Agent"}</span>}
                                    </h3>
                                )}
                                <div className="flex items-center mb-0.5 justify-between">
                                    <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarFallback className="bg-cyan-500 text-white hover:bg-cyan-600 border border-cyan-400 shadow-md transition-all duration-300">
                                                {contactMap[ticket.requester_id] ? contactMap[ticket.requester_id].charAt(0) : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-sm text-gray-800 ml-2">
                                            <span className="font-bold text-blue-600">
                                                {contactMap[ticket.requester_id] || 'Unknown Contact'}
                                            </span>
                                            {` reported via ${sourceMap[ticket.source]}`}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 text-right">
                                        {formatDate(ticket.created_at)}
                                        <span className="ml-2">
                                            ({formatDistanceToNow(parseISO(ticket.created_at), { addSuffix: true })})
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-start">
                                    {getSourceIcon(ticket.source)}
                                    <div className="flex flex-col ml-6">
                                        <div
                                            className="ticket-description prose max-w-none"
                                            dangerouslySetInnerHTML={{ __html: ticket.description_html || ticket.description }}
                                        />
                                        {ticket.attachments && ticket.attachments.length > 0 && (
                                            <div className="mt-3 p-2 bg-gray-100 rounded-lg border border-gray-300">
                                                <h3 className="text-sm font-semibold mb-2 text-gray-700">Attachments:</h3>
                                                <div className="flex flex-wrap gap-3">
                                                    {ticket.attachments.map((attachment, index) => {
                                                        const downloadFile = (e) => {
                                                            e.preventDefault();
                                                            const downloadLink = document.createElement('a');
                                                            downloadLink.href = attachment.attachment_url;
                                                            downloadLink.download = attachment.name;
                                                            downloadLink.target = '_blank';
                                                            downloadLink.rel = 'noopener noreferrer';
                                                            document.body.appendChild(downloadLink);
                                                            downloadLink.click();
                                                            document.body.removeChild(downloadLink);
                                                        };

                                                        const openLink = () => {
                                                            window.open(attachment.attachment_url, '_blank');
                                                        };

                                                        return (
                                                            <div key={index} className="group relative flex items-center p-2 rounded-lg bg-white border border-gray-300 shadow-sm transition-all hover:shadow-md">
                                                                <div className="cursor-pointer flex items-center gap-2 text-gray-700 hover:text-blue-600 group-hover:underline" onClick={openLink}>
                                                                    <PaperclipIcon className="h-4 w-4 text-gray-400" />
                                                                    <span className="text-sm font-medium truncate max-w-[150px]">{attachment.name}</span>
                                                                </div>

                                                                <button onClick={downloadFile} className="ml-2 text-blue-600 hover:text-blue-700">
                                                                    <Download className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                            <TicketConversations
                                conversations={conversations}
                                ticketId={ticketId}
                                onRefresh={refreshData}
                            />
                            <div ref={actionFormRef} className="mt-4">
                                {renderActionComponent()}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleReplyClick('reply')}
                                    disabled={isTicketClosed}
                                >
                                    <Reply className="h-4 w-4" /> Reply
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleReplyClick('note')}
                                >
                                    <FileText className="h-4 w-4" /> Note
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleReplyClick('forward')}
                                    disabled={isTicketClosed}
                                >
                                    <Forward className="h-4 w-4" /> Forward
                                </Button>
                            </div>
                        </div>

                        <div className="w-80 flex-shrink-0">
                            <Tabs defaultValue="properties">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="properties">Properties</TabsTrigger>
                                    <TabsTrigger value="contact">Contact Details</TabsTrigger>
                                </TabsList>

                                <TabsContent value="properties" className="mt-4">
                                    <TicketProperties
                                        ticket={ticket}
                                        isTicketClosed={isTicketClosed}
                                        onRefresh={refreshData}
                                    />
                                </TabsContent>

                                <TabsContent value="contact" className="mt-4">
                                    <Card className="p-4">
                                        <div className="flex flex-col items-center mb-4">
                                            <Avatar className="h-16 w-16 mb-2">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                                    {contactMap[ticket.requester_id] ? contactMap[ticket.requester_id].charAt(0) : '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="font-medium text-lg">{contactMap[ticket.requester_id] || 'Unknown Contact'}</h3>
                                            <p className="text-sm text-gray-500">{contactEmailMap[ticket.requester_id] || 'No email'}</p>
                                        </div>

                                        <Separator className="my-4" />

                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-sm font-medium mb-1">Timeline:</div>
                                                <div className="text-sm border border-gray-300 p-4 rounded-md shadow-sm">Add timeline here.</div>
                                            </div>
                                            <Button variant="outline" className="w-full text-sm" onClick={() => navigate(`/contacts/${ticket.requester_id}`)}>
                                                View Contact Details
                                            </Button>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TicketDetails;
