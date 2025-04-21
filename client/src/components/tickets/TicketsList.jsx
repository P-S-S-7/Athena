import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ticketService from "@/services/ticketService";
import TicketFilters from "./TicketFilters";
import TicketCard from "./layouts/TicketCard";
import TicketTable from "./layouts/TicketTable";
import { showSuccessToast, ToastContainer } from "../../utils/toast";
import { useError } from "@/contexts/ErrorContext";
import { useData } from "@/contexts/DataContext";
import { Download } from "lucide-react";

const TicketsList = ({ refreshTrigger, onRefresh }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [view, setView] = useState("card");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [totalTickets, setTotalTickets] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [activeFilters, setActiveFilters] = useState({});
    const [filterKey, setFilterKey] = useState(0);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);
    const { agentMap, statusMap, priorityMap, sourceMap, groupMap } = useData();
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
  const fetchTicketsData = async () => {
    try {
      setLoading(true);

      const response = await ticketService.getTickets(
        sortBy,
        sortOrder,
        page,
        perPage,
        activeFilters
      );

      setTickets(response.tickets);
      setTotalTickets(response.meta.total);
      setTotalPages(response.meta.total_pages);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  fetchTicketsData();
}, [sortBy, sortOrder, page, perPage, combinedRefreshTrigger, activeFilters, handleError]);

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTickets(tickets.map(ticket => ticket.id));
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
            handleError(new Error("No tickets selected."));
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
            handleError(error);
        } finally {
            setBulkActionLoading(false);
            setSelectedTickets([]);
        }
    };

    const handleTicketUpdate = (updatedTicket) => {
        setTickets(tickets =>
            tickets.map(ticket =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
        );
    };

    const handleFilterApply = (filterParams) => {
  try {
    const cleanParams = {};

    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        // For array values (like multi-select), only include if they have elements
        if (Array.isArray(value)) {
          if (value.length > 0) {
            cleanParams[key] = value;
          }
        } else {
          cleanParams[key] = value;
        }
      }
    });

    setActiveFilters(cleanParams);
    setPage(1); // Reset to first page when applying filters
  } catch (error) {
    handleError(error);
  }
};

    const handleSort = (field, order) => {
        setSortBy(field);
        setSortOrder(order);
        setPage(1);
    };

    const clearFilters = () => {
        setActiveFilters({});
        setFilterKey(prevKey => prevKey + 1);
        setPage(1);
    };

    const handleExport = async () => {
        try {
            await ticketService.exportTickets();
            showSuccessToast("Tickets exported successfully");
        } catch (error) {
            handleError(error);
        }
    };

    if (loading && page === 1) {
        return <div className="text-center py-10">Loading tickets...</div>;
    }

    return (
        <div className="space-y-4">
            <ToastContainer />

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all"
                        checked={selectedTickets.length === tickets.length && tickets.length > 0}
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

                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-1" /> Export
                    </Button>

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

                    <div className="text-sm text-gray-500">
                        {tickets.length > 0 ? (
                            `${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalTickets)} of ${totalTickets}`
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
                <div className="w-3/4">
                    {loading && page > 1 ? (
                        <div className="text-center py-10">Loading tickets...</div>
                    ) : view === "card" ? (
                        <div className="flex flex-col space-y-4">
                            {tickets.length > 0 ? (
                                tickets.map(ticket => (
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
                            tickets={tickets}
                            selectedTickets={selectedTickets}
                            onSelectTicket={handleSelectTicket}
                            statuses={statusMap}
                            priorities={priorityMap}
                            onTicketUpdate={handleTicketUpdate}
                        />
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

                <div className="w-1/4">
                    <TicketFilters key={filterKey} onApply={handleFilterApply} />
                </div>
            </div>
        </div>
    );
};

export default TicketsList;
