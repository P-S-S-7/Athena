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
    Globe,
    Upload,
    Download,
    Search
} from "lucide-react";
import companyService from "@/services/companyService";
import { showSuccessToast } from "../../utils/toast";
import { useError } from "@/contexts/ErrorContext";

const CompaniesList = ({ refreshTrigger, onRefresh }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

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

    useEffect(() => {
        const fetchCompaniesData = async () => {
            try {
                setLoading(true);

                const params = {
                    order_by: sortBy,
                    order_type: sortOrder,
                    page: page,
                    per_page: perPage
                };

                if (searchQuery) {
                    params.search = searchQuery;
                }

                const response = await companyService.getCompanies(
                    params.order_by,
                    params.order_type,
                    params.page,
                    params.per_page,
                    params
                );

                setCompanies(response.companies);
                setTotalCompanies(response.meta.total);
                setTotalPages(response.meta.total_pages);
            } catch (error) {
                handleError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompaniesData();
    }, [page, perPage, searchQuery, sortBy, sortOrder, combinedRefreshTrigger, handleError]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedCompanies(companies.map(company => company.id));
        } else {
            setSelectedCompanies([]);
        }
    };

    const handleSelectCompany = (companyId, checked) => {
        if (checked) {
            setSelectedCompanies([...selectedCompanies, companyId]);
        } else {
            setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
        }
    };

    const handleDelete = async (companyId) => {
        if (window.confirm("Are you sure you want to delete this company?")) {
            try {
                await companyService.deleteCompany(companyId);
                showSuccessToast("Company deleted successfully", { autoClose: 3000 });
                setTimeout(() => {
                    refreshData();
                }, 3000);
            } catch (error) {
                handleError(error);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCompanies.length === 0) {
            handleError(new Error("No companies selected."));
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedCompanies.length} companies?`)) {
            setBulkActionLoading(true);

            try {
                const deletePromises = selectedCompanies.map(companyId =>
                    companyService.deleteCompany(companyId)
                );

                await Promise.allSettled(deletePromises);
                showSuccessToast(`${selectedCompanies.length} companies deleted successfully`, { autoClose: 3000 });
                setSelectedCompanies([]);

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

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPage(1);
    };

    const getSortIndicator = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    if (loading && companies.length === 0) {
        return <div className="text-center py-10">Loading companies...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all"
                        checked={selectedCompanies.length === companies.length && companies.length > 0}
                        onCheckedChange={handleSelectAll}
                        disabled={bulkActionLoading}
                    />
                    <label htmlFor="select-all" className="text-sm">
                        {selectedCompanies.length > 0 ? (
                            <span className="flex items-center space-x-2">
                                <span className="text-sm font-medium mr-2">
                                    {selectedCompanies.length} selected
                                </span>
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
                                    placeholder="Search companies by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-4 py-2 w-full"
                                />
                            </div>
                        )}
                    </label>
                </div>

                <div className="flex items-center space-x-4">

                    <Button variant="outline">
                        <Upload className="h-4 w-4 mr-1" /> Import
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-1" /> Export
                    </Button>

                    <div className="text-sm text-gray-500">
                        {companies.length > 0 ? (
                            `${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalCompanies)} of ${totalCompanies}`
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
                <div className="w-full">
                    <div className="bg-white rounded-md border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead
                                        className="w-[500px] cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('name')}
                                    >
                                        Name{getSortIndicator('name')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('industry')}
                                    >
                                        Industry{getSortIndicator('industry')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('health_score')}
                                    >
                                        Health Score{getSortIndicator('health_score')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('account_tier')}
                                    >
                                        Account Tier{getSortIndicator('account_tier')}
                                    </TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.length > 0 ? (
                                    companies.map(company => (
                                        <TableRow key={company.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCompanies.includes(company.id)}
                                                    onCheckedChange={(checked) => handleSelectCompany(company.id, checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <button
                                                    onClick={() => navigate(`/companies/${company.id}`)}
                                                    className="text-blue-600 hover:underline font-bold text-left"
                                                >
                                                    {company.name || 'Unnamed Company'}
                                                </button>
                                            </TableCell>
                                            <TableCell>{company.industry || '-'}</TableCell>
                                            <TableCell>{company.health_score || '-'}</TableCell>
                                            <TableCell>{company.account_tier || '-'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigate(`/companies/${company.id}/edit`)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(company.id)}>
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
                                            {searchQuery
                                                ? "No companies match. Try different search criteria."
                                                : "No companies found. Add your first company!"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

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
            </div>
        </div>
    );
};

export default CompaniesList;
