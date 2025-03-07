import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ticketService from "@/services/ticketService";
import TicketFilters from "./TicketFilters";
import TicketCard from "./layouts/TicketCard";
import TicketTable from "./layouts/TicketTable";
import { showErrorToast, showSuccessToast, ToastContainer } from "../../utils/toast";
import { statusMap, priorityMap, sourceMap, agentMap, groupMap } from "@/utils/freshdeskMappings";

const TicketsList = ({ refreshTrigger, onRefreshNeeded }) => {
    const [allTickets, setAllTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [view, setView] = useState("card");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [activeFilters, setActiveFilters] = useState({});
    const [filterKey, setFilterKey] = useState(0);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);

    const combinedRefreshTrigger = useMemo(() => {
        return { external: refreshTrigger, local: localRefreshKey };
    }, [refreshTrigger, localRefreshKey]);

    const refreshData = () => {
        setLocalRefreshKey(prev => prev + 1);
        if (onRefreshNeeded) {
            onRefreshNeeded();
        }
    };

    useEffect(() => {
        const fetchTicketsData = async () => {
            try {
                setLoading(true);

                const response = await ticketService.getTickets(sortBy, sortOrder);
                setAllTickets(response.tickets);

                if (Object.keys(activeFilters).length > 0) {
                    const filtered = ticketService.filterTickets(response.tickets, activeFilters);
                    setFilteredTickets(filtered);
                } else {
                    setFilteredTickets(response.tickets);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                showErrorToast("Failed to fetch data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchTicketsData();
    }, [sortBy, sortOrder, combinedRefreshTrigger]);

    useEffect(() => {
        if (view === "table") {
            setPerPage(20);
        } else if (view === "card") {
            setPerPage(10);
        }
    }, [view]);

    const paginatedData = useMemo(() => {
        const totalTickets = filteredTickets.length;
        const totalPages = Math.ceil(totalTickets / perPage);

        const startIndex = (page - 1) * perPage;
        const endIndex = Math.min(startIndex + perPage, totalTickets);
        const currentTickets = filteredTickets.slice(startIndex, endIndex);

        return {
            currentTickets,
            totalTickets,
            totalPages
        };
    }, [filteredTickets, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [filteredTickets]);

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTickets(paginatedData.currentTickets.map(ticket => ticket.id));
        } else {
            setSelectedTickets([]);
        }
    };

    const handleSelectTicket = (ticketId, checked) => {
        if (checked) {
            setSelectedTickets([...selectedTickets, ticketId]);
        } else {
            setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
        }
    };

    const handleBulkAction = async (action, value) => {
        if (selectedTickets.length === 0) {
            showErrorToast("No tickets selected.");
            return;
        }

        setBulkActionLoading(true);
        try {
            if (action === "assign" && value) {
                const agentId = parseInt(value, 10);

                const updatePromises = selectedTickets.map(ticketId =>
                    ticketService.updateTicket(ticketId, { responder_id: agentId })
                );

                await Promise.all(updatePromises);
                setTimeout(() => showSuccessToast(`Tickets assigned to ${agentMap[agentId]}`), 1000);

                refreshData();
            } else if (action === "close") {
                const updatePromises = selectedTickets.map(ticketId =>
                    ticketService.updateTicket(ticketId, { status: 5 })
                );

                await Promise.all(updatePromises);
                setTimeout(() => showSuccessToast(`Tickets closed successfully`), 1000);

                refreshData();
            } else if (action === "delete") {
                if (window.confirm(`Do you want to delete ${selectedTickets.length} selected tickets?`)) {
                    const deletePromises = selectedTickets.map(ticketId =>
                        ticketService.deleteTicket(ticketId)
                    );

                    await Promise.allSettled(deletePromises);
                    setTimeout(() => showSuccessToast(`Tickets deleted successfully`), 1000);

                    refreshData();
                }
            }
        } catch (error) {
            console.error("Error performing bulk action:", error);
            showErrorToast("An error occurred during the bulk operation");
        } finally {
            setBulkActionLoading(false);
            setSelectedTickets([]);
        }
    };

    const handleTicketUpdate = (updatedTicket) => {
        setAllTickets(tickets =>
            tickets.map(ticket =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
        );

        setFilteredTickets(tickets =>
            tickets.map(ticket =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
        );
    };

    const handleFilterApply = (filterParams) => {
        try {
            setLoading(true);

            const cleanParams = {};

            Object.entries(filterParams).forEach(([key, value]) => {
                if (value !== "" && value !== null && value !== undefined) {
                    cleanParams[key] = value;
                }
            });

            setActiveFilters(cleanParams);

            const filtered = ticketService.filterTickets(allTickets, cleanParams);
            setFilteredTickets(filtered);

            setPage(1);
        } catch (error) {
            console.error("Error filtering tickets:", error);
            showErrorToast("Failed to filter tickets. Please try again.");
            setFilteredTickets(allTickets);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field, order) => {
        setSortBy(field);
        setSortOrder(order);

        const sorted = [...filteredTickets].sort((a, b) => {
            if (order === 'asc') {
                return a[field] > b[field] ? 1 : -1;
            } else {
                return a[field] < b[field] ? 1 : -1;
            }
        });

        setFilteredTickets(sorted);
    };

    const clearFilters = () => {
        setActiveFilters({});
        setFilteredTickets(allTickets);
        setFilterKey(prevKey => prevKey + 1);
    };

    if (loading) {
        return <div className="text-center py-10">Loading tickets...</div>;
    }

    return (
        <div className="space-y-4">
            <ToastContainer />

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all"
                        checked={selectedTickets.length === paginatedData.currentTickets.length && paginatedData.currentTickets.length > 0}
                        onCheckedChange={handleSelectAll}
                        disabled={bulkActionLoading}
                    />
                    <label htmlFor="select-all" className="text-sm">
                        {selectedTickets.length > 0 ? (
                            <span className="flex items-center space-x-2">
                                <Select
                                    onValueChange={(value) => handleBulkAction("assign", value)}
                                    disabled={bulkActionLoading}
                                >
                                    <SelectTrigger className="w-[160px] h-8 text-sm bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Assign to" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(agentMap).map(([id, name]) => (
                                            <SelectItem key={id} value={id}>{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction("close")}
                                    disabled={bulkActionLoading}
                                >
                                    {bulkActionLoading ? "Processing..." : "Close"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction("delete")}
                                    disabled={bulkActionLoading}
                                >
                                    {bulkActionLoading ? "Processing..." : "Delete"}
                                </Button>
                            </span>
                        ) : (
                            <div className="flex items-center space-x-4 bg-white px-4 py-2">
                                <span className="text-sm font-medium text-gray-700">Sort by:</span>

                                <Select
                                    value={sortBy}
                                    onValueChange={(value) => handleSort(value, sortOrder)}
                                >
                                    <SelectTrigger className="w-[160px] h-8 text-sm bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at">Date Created</SelectItem>
                                        <SelectItem value="due_by">Due By</SelectItem>
                                        <SelectItem value="updated_at">Last Modified</SelectItem>
                                        <SelectItem value="priority">Priority</SelectItem>
                                        <SelectItem value="status">Status</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="h-4 w-px bg-gray-300"></div>

                                <Select
                                    value={sortOrder}
                                    onValueChange={(value) => handleSort(sortBy, value)}
                                >
                                    <SelectTrigger className="w-[160px] h-8 text-sm bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asc">
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                                </svg>
                                                Ascending
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="desc">
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4" />
                                                </svg>
                                                Descending
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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

                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Layout:</span>
                        <Select value={view} onValueChange={setView}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="View" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="table">Table</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline">Export</Button>

                    <div className="text-sm text-gray-500">
                        {paginatedData.currentTickets.length > 0 ? (
                            `${(page - 1) * perPage + 1}-${Math.min(page * perPage, paginatedData.totalTickets)} of ${paginatedData.totalTickets}`
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
                            onClick={() => setPage(p => Math.min(paginatedData.totalPages, p + 1))}
                            disabled={page === paginatedData.totalPages || paginatedData.totalPages === 0}
                        >
                            &#187;
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex space-x-4">
                <div className="w-3/4">
                    {view === "card" ? (
                        <div className="flex flex-col space-y-4">
                            {paginatedData.currentTickets.length > 0 ? (
                                paginatedData.currentTickets.map(ticket => (
                                    <TicketCard
                                        key={`${ticket.id}-${ticket.status}-${ticket.responder_id}`}
                                        ticket={ticket}
                                        selected={selectedTickets.includes(ticket.id)}
                                        onSelect={(checked) => handleSelectTicket(ticket.id, checked)}
                                        priorities={priorityMap}
                                        statuses={statusMap}
                                        sources={sourceMap}
                                        agents={agentMap}
                                        groups={groupMap}
                                        onTicketUpdate={handleTicketUpdate}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-100">
                                    No tickets found. Adjust your filters or create a new ticket.
                                </div>
                            )}
                        </div>
                    ) : (
                        <TicketTable
                            tickets={paginatedData.currentTickets}
                            selectedTickets={selectedTickets}
                            onSelectTicket={handleSelectTicket}
                            statuses={statusMap}
                            priorities={priorityMap}
                            onTicketUpdate={handleTicketUpdate}
                        />
                    )}

                    {paginatedData.totalPages > 1 && (
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
                                    {[...Array(Math.min(5, paginatedData.totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (paginatedData.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= paginatedData.totalPages - 2) {
                                            pageNum = paginatedData.totalPages - 4 + i;
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
                                    onClick={() => setPage(p => Math.min(paginatedData.totalPages, p + 1))}
                                    disabled={page === paginatedData.totalPages || paginatedData.totalPages === 0}
                                >
                                    Next
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(paginatedData.totalPages)}
                                    disabled={page === paginatedData.totalPages || paginatedData.totalPages === 0}
                                >
                                    Last
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-1/4">
                    <TicketFilters key={filterKey} onApply={handleFilterApply} />
                </div>
            </div>
        </div>
    );
};

export default TicketsList;
