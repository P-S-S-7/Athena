import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ticketService from '@/services/ticketService';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import {
    Reply, FileText, Forward, Check,
    Merge, Trash2, BarChart, Globe, Ticket, Download, PaperclipIcon,
    Mail, Phone, MessageSquare, X, UserCircle, MessageCircle, Bot,
    Settings, ShoppingCart, MessagesSquare, ArrowLeft, Clock, User, Edit, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToastContainer, showSuccessToast } from '@/utils/toast';
import Sidebar from '@/utils/Sidebar';
import Header from '@/utils/Header';
import TicketConversations from './ticketDetailComponents/TicketConversations';
import AddReply from './ticketDetailComponents/AddReply';
import AddNote from './ticketDetailComponents/AddNote';
import ForwardTicket from './ticketDetailComponents/ForwardTicket';
import TicketProperties from './ticketDetailComponents/TicketProperties';
import { ErrorProvider, useError } from '@/contexts/ErrorContext';
import MergeTicketDialog from './ticketDetailComponents/MergeTicketDialog';
import EditTicketDialog from './ticketDetailComponents/EditTicketDialog';
import { useData } from '@/contexts/DataContext';

const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
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

const TicketDetailsContent = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const actionFormRef = useRef(null);
    const { handleError } = useError();

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [replyType, setReplyType] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const { sourceMap, contactMap, contactEmailMap, agentMap, companyMap } = useData();

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
                    handleError(convError);
                    setConversations([]);
                }

            } catch (error) {
                handleError(error);
                setError('Failed to load ticket details');
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();
    }, [ticketId, refreshKey, handleError]);

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
                    setIsMergeDialogOpen(true);
                    break;

                default:
                    break;
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMergeTickets = async (secondaryTicketIds) => {
        try {
            setIsUpdating(true);
            await ticketService.mergeTickets(ticketId, secondaryTicketIds);
            setTimeout(() => {
                setIsMergeDialogOpen(false);
                showSuccessToast('Tickets merged successfully');
            }, 1000);
            refreshData();
        } catch (error) {
            handleError(error);
            throw error;
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

    const isTicketClosed = ticket.status === 5 || ticket.status === 4;

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
                    user={user}
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
                        <EditTicketDialog
                            ticket={ticket}
                            onSuccess={refreshData}
                        />
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
                                    <div className="h-8 w-8 mr-1">
                                        {getLargeSourceIcon(ticket.source)}
                                    </div>
                                    <h1 className="text-xl font-medium ml-3">{ticket.subject}</h1>
                                </div>
                                {ticket.responder_id && (sourceMap[ticket.source] === 'Portal' || sourceMap[ticket.source] === 'Phone') && (
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
                                        <h3 className="text-gray-800 ml-2 ">
                                            <span className="font-bold text-blue-600">
                                                {contactMap[ticket.requester_id] || 'Unknown Contact'}
                                            </span>
                                            <span>{` reported via ${sourceMap[ticket.source]}`}</span>
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-700 text-right">
                                        {formatDate(ticket.created_at)}
                                        <span className="ml-2">
                                            ({formatDistanceToNow(parseISO(ticket.created_at), { addSuffix: true })})
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-start">
                                    <div className="h-4 w-4 mt-1 mr-2">
                                        {getSourceIcon(ticket.source)}
                                    </div>
                                    <div className="flex flex-col ml-6">
                                        {ticket.support_email && (
                                            <div className="input text-gray-600 mb-2">
                                                <span className="font-semibold">To:</span> <span className="italic">{ticket.support_email}</span>
                                            </div>
                                        )}
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
                                                                    <span className="text-sm font-medium truncate max-w-[150px] italic">{attachment.name}</span>
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
                                user={user}
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

                        <div className="w-100">
                            <Tabs defaultValue="properties" className="w-full mb-4">
                                <TabsList className="w-full grid grid-cols-2 bg-gray-50 rounded-lg p-1 h-12">
                                    <TabsTrigger
                                        value="properties"
                                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            <BarChart2 className="h-4 w-4 text-gray-600" />
                                            <span className="font-medium">Properties</span>
                                        </div>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="contact"
                                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            <User className="h-4 w-4 text-gray-600" />
                                            <span className="font-medium">Contact Details</span>
                                        </div>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="properties" className="mt-4 w-100">
                                    <TicketProperties
                                        ticket={ticket}
                                        isTicketClosed={isTicketClosed}
                                        onRefresh={refreshData}
                                    />
                                </TabsContent>

                                <TabsContent value="contact" className="mt-4">
                                    <Card className="border border-gray-200 rounded-b-lg shadow-sm overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex flex-col sm:flex-row items-center gap-4">
                                            <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
                                                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                                                    {contactMap[ticket.requester_id] ? contactMap[ticket.requester_id].charAt(0) : '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-center sm:text-left">
                                                <h3 className="font-semibold text-lg text-gray-800">{contactMap[ticket.requester_id] || 'Unknown Contact'}</h3>
                                                {contactEmailMap[ticket.requester_id] ? (
                                                    <a href={`mailto:${contactEmailMap[ticket.requester_id]}`}
                                                    className="text-sm text-blue-600 hover:underline flex items-center justify-center sm:justify-start gap-1 italic">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {contactEmailMap[ticket.requester_id]}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No email available</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-blue-100 p-1.5 rounded-full">
                                                        <Clock className="h-4 w-4 text-blue-700" />
                                                    </div>
                                                    <h4 className="text-sm font-medium text-gray-700">Contact Timeline</h4>
                                                </div>
                                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-sm text-gray-600">
                                                    <div className="flex flex-col space-y-3">
                                                        <div className="italic">Timeline to be added here.</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-purple-100 p-1.5 rounded-full">
                                                        <User className="h-4 w-4 text-purple-700" />
                                                    </div>
                                                    <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
                                                </div>
                                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {ticket.company_id && companyMap[ticket.company_id] && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Company</p>
                                                            <p className="font-medium italic">{companyMap[ticket.company_id]}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs text-gray-500">Contact ID</p>
                                                        <p className="font-medium italic">#{ticket.requester_id}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:flex-1 text-sm flex items-center gap-1"
                                                    onClick={() => navigate(`/contacts/${ticket.requester_id}`)}
                                                >
                                                    <User className="h-3.5 w-3.5" />
                                                    View Contact
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:flex-1 text-sm flex items-center gap-1"
                                                    onClick={() => navigate(`/contacts/${ticket.requester_id}/edit`)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    Edit Contact
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>
            <MergeTicketDialog
                isOpen={isMergeDialogOpen}
                onClose={() => setIsMergeDialogOpen(false)}
                primaryTicket={ticket}
                onMerge={handleMergeTickets}
            />
        </div>
    );
};

const TicketDetails = () => {
    return (
        <ErrorProvider>
            <TicketDetailsContent />
        </ErrorProvider>
    );
};

export default TicketDetails;
