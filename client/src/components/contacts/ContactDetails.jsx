import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Tag,
    Edit,
    Trash2,
    ArrowLeft,
    TicketIcon,
    AlertCircle,
    Info,
    Pencil
} from "lucide-react";
import contactService from "@/services/contactService";
import ticketService from "@/services/ticketService";
import { format, parseISO } from "date-fns";
import { showSuccessToast, ToastContainer } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "../../utils/Sidebar";
import Header from "../../utils/Header";
import { ErrorProvider, useError } from "../../contexts/ErrorContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ContactDetailsContent = () => {
    const { contactId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();

    const [contact, setContact] = useState(null);
    const [relatedTickets, setRelatedTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const fetchContactData = async () => {
            try {
                setLoading(true);

                const { contact } = await contactService.getContact(contactId);
                setContact(contact);

                try {
                    const ticketsResponse = await ticketService.getTickets();
                    const relatedTickets = ticketsResponse.tickets.filter(
                        ticket => ticket.requester_id === parseInt(contactId)
                    );
                    setRelatedTickets(relatedTickets);
                } catch (error) {
                    console.error("Error fetching related tickets:", error);
                    setRelatedTickets([]);
                }

            } catch (error) {
                handleError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchContactData();
    }, [contactId, handleError]);

    const handleDelete = async () => {
        try {
            await contactService.deleteContact(contactId);
            setTimeout(() => showSuccessToast("Contact deleted successfully"), 1000);
            navigate("/contacts");
        } catch (error) {
            handleError(error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
        } catch (error) {
            console.error("Error formatting date:", error);
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                    <Header title="Contact Details" />
                    <main className="flex-grow p-6 overflow-auto">
                        <div className="flex items-center justify-center h-full">
                            <div className="text-lg font-medium">Loading contact details...</div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                    <Header title="Contact Not Found" />
                    <main className="flex-grow p-6 overflow-auto">
                        <div className="flex flex-col items-center justify-center h-full">
                            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Contact Not Found</h2>
                            <p className="text-gray-600 mb-6">
                                The contact you're looking for doesn't exist or you don't have permission to view it.
                            </p>
                            <Button onClick={() => navigate("/contacts")}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-grow">
                <Header
                    title={`Contact: ${contact.name}`}
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />
                <main className="flex-grow p-6 overflow-auto">
                    <ToastContainer />

                    <div className="mb-6 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/contacts")}
                            className="flex items-center"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
                        </Button>
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/contacts/${contactId}/edit`)}
                                className="flex items-center"
                            >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center mb-6">
                                    <Avatar className="h-24 w-24 mb-4">
                                        {contact.avatar && contact.avatar.attachment_url ? (
                                            <AvatarImage src={contact.avatar.attachment_url} alt={contact.name} />
                                        ) : null}
                                        <AvatarFallback className="text-3xl bg-blue-100 text-blue-800">
                                            {contact.name ? contact.name.charAt(0).toUpperCase() : "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-2xl font-bold">{contact.name}</h2>
                                    {contact.job_title && (
                                        <p className="text-gray-600">{contact.job_title}</p>
                                    )}
                                    {contact.company_name && (
                                        <p className="text-gray-600">{contact.company_name}</p>
                                    )}
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-4">
                                    {contact.email && (
                                        <div className="flex items-start">
                                            <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                                <p className="text-sm break-all">
                                                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                                        {contact.email}
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.other_emails && contact.other_emails.length > 0 && (
                                        <div className="flex items-start">
                                            <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 mb-1">Other Emails</p>
                                                <div className="space-y-1">
                                                    {contact.other_emails.map((email, index) => (
                                                        <p key={index} className="text-sm break-all">
                                                            <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                                                                {email}
                                                            </a>
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {contact.phone && (
                                        <div className="flex items-start">
                                            <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 mb-1">Phone</p>
                                                <p className="text-sm">
                                                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                                        {contact.phone}
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.mobile && (
                                        <div className="flex items-start">
                                            <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 mb-1">Mobile</p>
                                                <p className="text-sm">
                                                    <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline">
                                                        {contact.mobile}
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.address && (
                                        <div className="flex items-start">
                                            <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 mb-1">Address</p>
                                                <p className="text-sm whitespace-pre-line">{contact.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 mb-1">Created</p>
                                            <p className="text-sm">{formatDate(contact.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                                            <p className="text-sm">{formatDate(contact.updated_at)}</p>
                                        </div>
                                    </div>

                                    {contact.tags && contact.tags.length > 0 && (
                                        <div className="flex items-start mt-4">
                                            <Tag className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 mb-2">Tags</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {contact.tags.map((tag, index) => (
                                                        <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <CardHeader>
                                        <TabsList className="grid grid-cols-2 w-full">
                                            <TabsTrigger value="overview">Overview</TabsTrigger>
                                            <TabsTrigger value="tickets">
                                                Tickets ({relatedTickets.length})
                                            </TabsTrigger>
                                        </TabsList>
                                    </CardHeader>

                                    <CardContent>
                                        <TabsContent value="overview" className="space-y-6">
                                            {contact.description ? (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <Info className="h-5 w-5 mr-2" /> About
                                                    </h3>
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <p className="whitespace-pre-line">{contact.description}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                    <Info className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                                    <h3 className="text-lg font-medium text-gray-900">No additional information</h3>
                                                    <p className="text-gray-500 mt-1">This contact has no description or additional details.</p>
                                                    <Button
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => navigate(`/contacts/${contactId}/edit`)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" /> Add Information
                                                    </Button>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                    <TicketIcon className="h-5 w-5 mr-2" /> Recent Tickets
                                                </h3>

                                                {relatedTickets.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {relatedTickets.slice(0, 3).map(ticket => (
                                                            <div
                                                                key={ticket.id}
                                                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="font-medium text-blue-600 hover:underline">{ticket.subject}</h4>
                                                                    <Badge
                                                                        variant={
                                                                            ticket.status === 2 ? "outline" :
                                                                                ticket.status === 3 ? "secondary" :
                                                                                    ticket.status === 4 ? "default" :
                                                                                        "outline"
                                                                        }
                                                                    >
                                                                        {ticket.status === 2 ? "Open" :
                                                                            ticket.status === 3 ? "Pending" :
                                                                                ticket.status === 4 ? "Resolved" :
                                                                                    ticket.status === 5 ? "Closed" :
                                                                                        "Unknown"}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    Created: {formatDate(ticket.created_at)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                        <p className="text-gray-500">No tickets found for this contact.</p>
                                                        <Button
                                                            variant="outline"
                                                            className="mt-4"
                                                            onClick={() => navigate("/tickets/new", { state: { contactId: contact.id } })}
                                                        >
                                                            Create Ticket
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="tickets">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <TicketIcon className="h-5 w-5 mr-2" /> All Tickets
                                            </h3>

                                            {relatedTickets.length > 0 ? (
                                                <div className="space-y-3">
                                                    {relatedTickets.map(ticket => (
                                                        <div
                                                            key={ticket.id}
                                                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium text-blue-600 hover:underline">{ticket.subject}</h4>
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        #{ticket.id} • Created: {formatDate(ticket.created_at)}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <Badge
                                                                        variant={
                                                                            ticket.status === 2 ? "outline" :
                                                                                ticket.status === 3 ? "secondary" :
                                                                                    ticket.status === 4 ? "default" :
                                                                                        "outline"
                                                                        }
                                                                    >
                                                                        {ticket.status === 2 ? "Open" :
                                                                            ticket.status === 3 ? "Pending" :
                                                                                ticket.status === 4 ? "Resolved" :
                                                                                    ticket.status === 5 ? "Closed" :
                                                                                        "Unknown"}
                                                                    </Badge>
                                                                    <span className="text-xs text-gray-500 mt-1">
                                                                        Priority: {
                                                                            ticket.priority === 1 ? "Low" :
                                                                                ticket.priority === 2 ? "Medium" :
                                                                                    ticket.priority === 3 ? "High" :
                                                                                        ticket.priority === 4 ? "Urgent" :
                                                                                            "Unknown"
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                    <TicketIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                                    <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
                                                    <p className="text-gray-500 mt-1">This contact hasn't created any tickets yet.</p>
                                                    <Button
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => navigate("/tickets/new", { state: { contactId: contact.id } })}
                                                    >
                                                        Create New Ticket
                                                    </Button>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </CardContent>
                                </Tabs>
                            </Card>
                        </div>
                    </div>

                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the contact "{contact.name}".
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </main>
            </div>
        </div>
    );
};

const ContactDetails = () => {
    return (
        <ErrorProvider>
            <ContactDetailsContent />
        </ErrorProvider>
    );
};

export default ContactDetails;
