import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Building,
    Calendar,
    Clock,
    Edit,
    Trash2,
    ArrowLeft,
    AlertCircle,
    Info,
    Globe,
    UserIcon,
    LineChart,
    Layers
} from "lucide-react";
import companyService from "@/services/companyService";
import contactService from "@/services/contactService";
import { format, parseISO } from "date-fns";
import { showSuccessToast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import { useError } from "../../contexts/ErrorContext";
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
import Sidebar from "../../utils/Sidebar";
import Header from "../../utils/Header";

const CompanyDetails = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();

    const [company, setCompany] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                setLoading(true);

                const { company } = await companyService.getCompany(companyId);
                setCompany(company);

                try {
                    const contactsResponse = await contactService.getContacts();
                    const relatedContacts = contactsResponse.contacts.filter(
                        contact => contact.company_id === parseInt(companyId)
                    );
                    setContacts(relatedContacts);
                } catch (error) {
                    console.error("Error fetching related contacts:", error);
                    setContacts([]);
                }

            } catch (error) {
                handleError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [companyId, handleError]);

    const handleDelete = async () => {
        try {
            await companyService.deleteCompany(companyId);
            setTimeout(() => showSuccessToast("Company deleted successfully"), 1000);
            navigate("/companies");
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
                    <Header title="Company Details" />
                    <main className="flex-grow p-6 overflow-auto">
                        <div className="flex items-center justify-center h-full">
                            <div className="text-lg font-medium">Loading company details...</div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
                <p className="text-gray-600 mb-6">
                    The company you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Button onClick={() => navigate("/companies")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Companies
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-grow">
                <Header
                    title={`Company: ${company.name}`}
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />
                <div className="space-y-6 py-4 px-4">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/companies")}
                            className="flex items-center"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Companies
                        </Button>
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/companies/${companyId}/edit`)}
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
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl">
                                    <Building className="mr-2 h-5 w-5" /> {company.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {company.industry && (
                                    <div className="flex items-start">
                                        <Layers className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 mb-1">Industry</p>
                                            <p className="text-sm">{company.industry}</p>
                                        </div>
                                    </div>
                                )}

                                {company.domains && company.domains.length > 0 && (
                                    <div className="flex items-start">
                                        <Globe className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 mb-1">Domains</p>
                                            <div className="space-y-1">
                                                {company.domains.map((domain, index) => (
                                                    <Badge key={index} variant="outline" className="mr-1">
                                                        {domain}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {company.health_score && (
                                    <div className="flex items-start">
                                        <LineChart className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 mb-1">Health Score</p>
                                            <p className="text-sm">{company.health_score}</p>
                                        </div>
                                    </div>
                                )}

                                {company.account_tier && (
                                    <div className="flex items-start">
                                        <Layers className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 mb-1">Account Tier</p>
                                            <p className="text-sm">{company.account_tier}</p>
                                        </div>
                                    </div>
                                )}

                                <Separator className="my-2" />

                                <div className="flex items-start">
                                    <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">Created</p>
                                        <p className="text-sm">{formatDate(company.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                                        <p className="text-sm">{formatDate(company.updated_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <UserIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">Contacts</p>
                                        <p className="text-sm">{contacts.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <CardHeader>
                                        <TabsList className="grid grid-cols-2 w-full">
                                            <TabsTrigger value="overview">Overview</TabsTrigger>
                                            <TabsTrigger value="contacts">
                                                Contacts ({contacts.length})
                                            </TabsTrigger>
                                        </TabsList>
                                    </CardHeader>

                                    <CardContent>
                                        <TabsContent value="overview" className="space-y-6">
                                            {company.description ? (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <Info className="h-5 w-5 mr-2" /> Description
                                                    </h3>
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <p className="whitespace-pre-line">{company.description}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                    <Info className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                                    <h3 className="text-lg font-medium text-gray-900">No description available</h3>
                                                    <p className="text-gray-500 mt-1">This company has no description or additional details.</p>
                                                    <Button
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => navigate(`/companies/${companyId}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" /> Add Description
                                                    </Button>
                                                </div>
                                            )}

                                            {company.note ? (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                        <Info className="h-5 w-5 mr-2" /> Notes
                                                    </h3>
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <p className="whitespace-pre-line">{company.note}</p>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </TabsContent>

                                        <TabsContent value="contacts">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <UserIcon className="h-5 w-5 mr-2" /> Associated Contacts
                                            </h3>

                                            {contacts.length > 0 ? (
                                                <div className="space-y-3">
                                                    {contacts.map(contact => (
                                                        <div
                                                            key={contact.id}
                                                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                            onClick={() => navigate(`/contacts/${contact.id}`)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium text-blue-600 hover:underline">{contact.name}</h4>
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                        {contact.job_title || 'No title'} • {contact.email || 'No email'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <p className="text-xs text-gray-500">
                                                                        Created: {formatDate(contact.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                    <UserIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                                    <h3 className="text-lg font-medium text-gray-900">No contacts found</h3>
                                                    <p className="text-gray-500 mt-1">This company doesn't have any associated contacts yet.</p>
                                                    <Button
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => navigate("/contacts/new", { state: { companyId: company.id } })}
                                                    >
                                                        Add Contact
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
                                    This will permanently delete the company "{company.name}".
                                    {contacts.length > 0 && ` This company has ${contacts.length} associated contacts which will be disassociated.`}
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
                </div>
            </div>
        </div>
    );
};

export default CompanyDetails;
