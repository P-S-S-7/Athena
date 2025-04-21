import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    UserPlus,
    Upload,
    Download,
    Search,
    Phone
} from "lucide-react";
import contactService from "@/services/contactService";
import ContactFilters from "./ContactFilters";
import { showSuccessToast, ToastContainer } from "../../utils/toast";
import { useError } from "@/contexts/ErrorContext";
import MergeContactsDialog from "./MergeContactsDialog";
import { useData } from "@/contexts/DataContext";

const ContactsList = ({ refreshTrigger, onRefresh }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [totalContacts, setTotalContacts] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [activeFilters, setActiveFilters] = useState({});
    const [filterKey, setFilterKey] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);
    const { companyMap } = useData();

    const navigate = useNavigate();
    const { handleError } = useError();

    const combinedRefreshTrigger = useMemo(() => {
        return { external: refreshTrigger, local: localRefreshKey };
    }, [refreshTrigger, localRefreshKey]);

    const refreshData = () => {
        setLocalRefreshKey(prev => prev + 1);
        if (onRefresh) {
            onRefresh();
        }
    };

    const loadContacts = async (resetPage = false) => {
        try {
            setLoading(true);

            const currentPage = resetPage ? 1 : page;
            if (resetPage) {
                setPage(1);
            }

            // Combine all filters including search query
            const combinedFilters = {
                ...activeFilters
            };

            if (searchQuery) {
                combinedFilters.search = searchQuery;
            }

            const response = await contactService.getContacts(
                sortBy,
                sortOrder,
                currentPage,
                perPage,
                combinedFilters
            );

            setContacts(response.contacts);
            setTotalContacts(response.meta.total);
            setTotalPages(response.meta.total_pages);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    // Load contacts on initial load and when dependencies change
    useEffect(() => {
        loadContacts();
    }, [sortBy, sortOrder, page, perPage, combinedRefreshTrigger]);

    // Handle search with debounce
    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeoutId = setTimeout(() => {
            loadContacts(true); // Reset to page 1 when search changes
        }, 500); // 500ms delay

        setSearchTimeout(timeoutId);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchQuery, activeFilters]);

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedContacts(contacts.map(contact => contact.id));
        } else {
            setSelectedContacts([]);
        }
    };

    const handleSelectContact = (contactId, checked) => {
        if (checked) {
            setSelectedContacts([...selectedContacts, contactId]);
        } else {
            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        }
    };

    const handleDelete = async (contactId) => {
        if (window.confirm("Are you sure you want to delete this contact?")) {
            try {
                await contactService.deleteContact(contactId);
                showSuccessToast("Contact deleted successfully", { autoClose: 3000 });
                setTimeout(() => {
                    refreshData();
                }, 3000);
            } catch (error) {
                handleError(error);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedContacts.length === 0) {
            handleError(new Error("No contacts selected."));
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
            setBulkActionLoading(true);

            try {
                const deletePromises = selectedContacts.map(contactId =>
                    contactService.deleteContact(contactId)
                );

                await Promise.allSettled(deletePromises);
                showSuccessToast(`${selectedContacts.length} contacts deleted successfully`, { autoClose: 3000 });
                setSelectedContacts([]);

                setTimeout(() => {
                    refreshData();
                }, 3000);
            } catch (error) {
                handleError(error);
            } finally {
                setBulkActionLoading(false);
            }
        }
    };

    const handleMerge = () => {
        if (selectedContacts.length < 2) {
            handleError(new Error("Select at least 2 contacts to merge."));
            return;
        }

        setIsMergeDialogOpen(true);
    };

    const handleMergeConfirm = async (primaryId, secondaryIds, contactData = {}) => {
        try {
            setBulkActionLoading(true);

            await contactService.mergeContacts(primaryId, secondaryIds, contactData);
            setIsMergeDialogOpen(false);
            showSuccessToast("Contacts merged successfully", { autoClose: 3000 });
            setSelectedContacts([]);

            setTimeout(() => {
                refreshData();
            }, 3000);
        } catch (error) {
            handleError(error);
        } finally {
            setBulkActionLoading(false);
        }
    };

    const handleFilterApply = (filterParams) => {
        const cleanParams = {};

        Object.entries(filterParams).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
                cleanParams[key] = value;
            }
        });

        setActiveFilters(cleanParams);
        // No need to call loadContacts here as it will be triggered by the useEffect
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearchQuery('');
        setFilterKey(prevKey => prevKey + 1);
        // No need to call loadContacts here as it will be triggered by the useEffect
    };

    const handleSort = (field) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
        // No need to set page=1 here as loadContacts will be triggered by the useEffect
    };

    const handleExport = async () => {
        try {
            await contactService.exportContacts();
            showSuccessToast("Contacts exported successfully", { autoClose: 3000 });
        } catch (error) {
            handleError(error);
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return null;

        return sortOrder === 'asc'
            ? <span className="ml-1">↑</span>
            : <span className="ml-1">↓</span>;
    };

    if (loading && page === 1) {
        return <div className="text-center py-10">Loading contacts...</div>;
    }

    return (
        <div className="space-y-4">
            <ToastContainer />

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all"
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onCheckedChange={handleSelectAll}
                        disabled={bulkActionLoading}
                    />
                    <label htmlFor="select-all" className="text-sm">
                        {selectedContacts.length > 0 ? (
                            <span className="flex items-center space-x-2">
                                <span className="text-sm font-medium mr-2">
                                    {selectedContacts.length} selected
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMerge}
                                    disabled={bulkActionLoading || selectedContacts.length < 2}
                                >
                                    <UserPlus className="h-4 w-4 mr-1" /> Merge
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    disabled={bulkActionLoading}
                                    className="text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </span>
                        ) : (
                            <div className="relative w-80">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search contacts by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full"
                                />
                            </div>
                        )}
                    </label>
                </div>

                <div className="flex items-center space-x-4">
                    {Object.keys(activeFilters).length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                            Clear filters ({Object.keys(activeFilters).length})
                        </Button>
                    )}

                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>

                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-1" /> Export
                    </Button>

                    <div className="text-sm text-gray-500">
                        {contacts.length > 0 ? (
                            `${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalContacts)} of ${totalContacts}`
                        ) : (
                            '0-0 of 0'
                        )}
                    </div>

                    <div className="flex items-center space-x-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            &#171;
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                        >
                            &#187;
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex space-x-4">
                <div className={showFilters ? "w-3/4" : "w-full"}>
                    {loading && page > 1 ? (
                        <div className="text-center py-10">Loading contacts...</div>
                    ) : (
                        <div className="bg-white rounded-md border shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Contact Name {getSortIcon('name')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleSort('job_title')}
                                        >
                                            <div className="flex items-center">
                                                Title {getSortIcon('job_title')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleSort('company_id')}
                                        >
                                            <div className="flex items-center">
                                                Company {getSortIcon('company_id')}
                                            </div>
                                        </TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contacts.length > 0 ? (
                                        contacts.map(contact => (
                                            <TableRow key={contact.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedContacts.includes(contact.id)}
                                                        onCheckedChange={(checked) => handleSelectContact(contact.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <button
                                                        onClick={() => navigate(`/contacts/${contact.id}`)}
                                                        className="text-blue-600 hover:underline font-medium text-left"
                                                    >
                                                        {contact.name || 'Unnamed'}
                                                    </button>
                                                </TableCell>
                                                <TableCell>{contact.job_title || '-'}</TableCell>
                                                <TableCell>{companyMap[contact.company_id] || '-'}</TableCell>
                                                <TableCell>
                                                    {contact.email ? (
                                                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center">
                                                            <Mail className="h-4 w-4 mr-1" />
                                                            {contact.email.length > 25 ? contact.email.slice(0, 25) + '...' : contact.email}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {contact.phone ? (
                                                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline flex items-center">
                                                            <Phone className="h-4 w-4 mr-1" /> {contact.phone}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}/edit`)}>
                                                                <Edit className="h-4 w-4 mr-2" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDelete(contact.id)}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                                {searchQuery || Object.keys(activeFilters).length > 0
                                                    ? "No contacts match your filters. Try different search criteria."
                                                    : "No contacts found. Add your first contact!"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                >
                                    First
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>

                                <div className="flex items-center space-x-1 mx-2">
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={i}
                                                size="sm"
                                                variant={page === pageNum ? "default" : "outline"}
                                                onClick={() => setPage(pageNum)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                >
                                    Next
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page === totalPages || totalPages === 0}
                                >
                                    Last
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {showFilters && (
                    <div className="w-1/4">
                        <ContactFilters key={filterKey} onApply={handleFilterApply} />
                    </div>
                )}
            </div>

            <MergeContactsDialog
                isOpen={isMergeDialogOpen}
                onClose={() => setIsMergeDialogOpen(false)}
                onMerge={handleMergeConfirm}
                selectedContacts={selectedContacts}
                contacts={contacts.filter(contact => selectedContacts.includes(contact.id))}
            />
        </div>
    );
};

export default ContactsList;
