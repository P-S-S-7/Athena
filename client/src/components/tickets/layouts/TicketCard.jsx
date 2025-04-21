import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Clock, User, Calendar, Building, Ticket } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import ticketService from "@/services/ticketService";
import groupService from "@/services/groupService";
import { showSuccessToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useError } from "@/contexts/ErrorContext";
import { useData } from "@/contexts/DataContext";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const TicketCard = ({
    ticket: initialTicket,
    selected,
    onSelect,
    priorities,
    statuses,
    sources,
    agents,
    groups,
    onTicketUpdate
}) => {
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(initialTicket);
    const [availableAgents, setAvailableAgents] = useState({});
    const [isUpdating, setIsUpdating] = useState({
        priority: false,
        status: false,
        group_id: false,
        responder_id: false,
    });
    const { contactMap, companyMap } = useData();
    const { handleError } = useError();

    useEffect(() => {
        const fetchGroupAgents = async (groupId) => {
            if (groupId) {
                try {
                    const groupAgents = await groupService.getGroupAgents(groupId);
                    const filteredAgents = groupAgents.agent_ids.reduce((acc, id) => {
                        if (agents[id]) {
                            acc[id] = agents[id];
                        }
                        return acc;
                    }, {});
                    setAvailableAgents(filteredAgents);
                } catch (error) {
                    handleError(error);
                    setAvailableAgents({});
                }
            } else {
                setAvailableAgents(agents);
            }
        };
        fetchGroupAgents(ticket.group_id);
    }, [ticket.group_id, agents, handleError]);

    const isOverdue = ticket.due_by && isPast(new Date(ticket.due_by));
    const isNew = ticket.created_at && new Date(ticket.created_at) >= new Date(Date.now() - 1000 * 60 * 60 * 24);
    const isClosed = ticket.status === 4 || ticket.status === 5;

    const updateTicket = async (fieldName, value) => {
        setIsUpdating(prev => ({ ...prev, [fieldName]: true }));
        try {
            const ticketData = { [fieldName]: value };
            if ((fieldName === 'group_id' || fieldName === 'responder_id') && value === "None") {
                ticketData[fieldName] = null;
            }
            if (typeof value === "string" && value !== "None") {
                ticketData[fieldName] = parseInt(value, 10);
            }
            try {
                await ticketService.updateTicket(ticket.id, ticketData);
            }
            catch (error) {
                handleError(error);
                return;
            }
            const updatedTicket = { ...ticket, ...ticketData };
            setTicket(updatedTicket);
            if (onTicketUpdate) {
                onTicketUpdate(updatedTicket);
            }
            showSuccessToast("Ticket updated successfully");
        } catch (error) {
            handleError(error);
        } finally {
            setIsUpdating(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    function getPriorityColor(priority) {
        const colors = {
            1: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
            2: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
            3: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
            4: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        };
        return colors[priority] || "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    }

    const getStatusColor = (status) => {
        const colors = {
            2: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
            3: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
            4: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
            5: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    };

    const navigateToTicketDetails = () => {
        navigate(`/tickets/${ticket.id}`);
    };

    const handleCardClick = (e) => {
        if (
            e.target.closest('.select-control') ||
            e.target.closest('button') ||
            e.target.closest('input[type="checkbox"]')
        ) {
            return;
        }
        navigateToTicketDetails();
    };

    return (
        <div
            className={`
                transition-all duration-200 border mb-3 cursor-pointer
                ${selected ? "border-blue-500 ring-1 ring-blue-500 shadow-md" : "border-gray-200 hover:border-blue-400 shadow-sm hover:shadow"}
                ${isClosed ? "bg-gray-50 opacity-50" : "bg-white"}
            `}
            onClick={handleCardClick}
        >
            <div className="p-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div onClick={(e) => e.stopPropagation()} className="pr-1.5">
                            <Checkbox
                                checked={selected}
                                onCheckedChange={onSelect}
                                className={`h-4 w-4 ${selected ? "text-blue-600" : "text-gray-400"}`}
                            />
                        </div>
                        <span className="text-[15px] font-medium text-gray-800 line-clamp-1 hover:text-blue-700 transition-colors">
                            {ticket.subject.length > 60 ? `${ticket.subject.substring(0, ticket.subject.lastIndexOf(' ', 60))}...` : ticket.subject}
                            <span className="text-gray-500 ml-1">#{ticket.id}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isNew && !isClosed && (
                            <Badge className="text-[10px] py-0 h-4 px-1.5 font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                New
                            </Badge>
                        )}
                        {isOverdue && !isClosed && (
                            <Badge className="text-[10px] py-0 h-4 px-1.5 font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                                Overdue
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1 mt-2 text-[13px] text-gray-600">
                    <div className="flex items-center">
                        <User className="mr-1.5 h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <span className="truncate text-gray-700 font-medium">
                            {contactMap[ticket.requester_id] || "..."}
                        </span>
                    </div>

                    {ticket.company_id && companyMap[ticket.company_id] && (
                        <div className="flex items-center">
                            <Building className="mr-1.5 h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                            <span className="truncate text-gray-600">
                                {companyMap[ticket.company_id]}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center">
                        <Calendar className="mr-1.5 h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <span className="truncate text-gray-600">
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    {ticket.due_by && !isClosed && (
                        <div className="flex items-center col-span-2">
                            <Clock className={`mr-1.5 h-3.5 w-3.5 ${isOverdue ? "text-red-600" : "text-gray-500"} flex-shrink-0`} />
                            <span className={`truncate ${isOverdue ? "text-red-700 font-medium" : "text-gray-600"}`}>
                                {isOverdue ? "Overdue" : "Due"}: {formatDistanceToNow(new Date(ticket.due_by), { addSuffix: true })}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                    <div className="flex items-center">
                        {ticket.source && (
                            <Badge variant="outline" className="h-5 text-[11px] py-0 px-1.5 flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">
                                <Ticket className="h-3 w-3 text-gray-500" />
                                <span>{sources[ticket.source] || "Unknown"}</span>
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="select-control" onClick={(e) => e.stopPropagation()}>
                                        <Select value={String(ticket.priority)} onValueChange={(value) => updateTicket('priority', value)} disabled={isUpdating.priority}>
                                            <SelectTrigger className={`w-25 h-6 text-xs min-h-0 py-0 px-2 ${getPriorityColor(ticket.priority)}`}>
                                                <SelectValue>
                                                    {isUpdating.priority ? "..." : priorities[ticket.priority]}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(priorities).map(([key, value]) => (
                                                    <SelectItem key={key} value={key} className="text-xs">{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs py-1 px-2">
                                    <p>Priority</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="select-control" onClick={(e) => e.stopPropagation()}>
                                        <Select value={String(ticket.status)} onValueChange={(value) => updateTicket('status', value)} disabled={isUpdating.status}>
                                            <SelectTrigger className={`w-25 h-6 text-xs min-h-0 py-0 px-2 ${getStatusColor(ticket.status)}`}>
                                                <SelectValue>
                                                    {isUpdating.status ? "..." : statuses[ticket.status]}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(statuses).map(([key, value]) => (
                                                    <SelectItem key={key} value={key} className="text-xs">{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs py-1 px-2">
                                    <p>Status</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="select-control" onClick={(e) => e.stopPropagation()}>
                                        <Select
                                            value={ticket.group_id ? String(ticket.group_id) : "No group"}
                                            onValueChange={(value) => {
                                                updateTicket('group_id', value);
                                                if (value !== "No group") {
                                                    setAvailableAgents(currentAgents => ({
                                                        ...currentAgents,
                                                        responder_id: null
                                                    }));
                                                }
                                            }}
                                            disabled={isUpdating.group_id}
                                        >
                                            <SelectTrigger className="w-25 h-6 text-xs min-h-0 py-0 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800">
                                                <SelectValue>
                                                    {isUpdating.group_id ? "..." :
                                                    (ticket.group_id ?
                                                    (groups[ticket.group_id]?.length > 7 ?
                                                    groups[ticket.group_id].substring(0, 7) + "..." :
                                                    groups[ticket.group_id]) :
                                                    "No group")}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="No group" className="text-xs">No group</SelectItem>
                                                {Object.entries(groups).map(([key, value]) => (
                                                    <SelectItem key={key} value={key} className="text-xs">{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs py-1 px-2">
                                    <p>Group</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="select-control" onClick={(e) => e.stopPropagation()}>
                                        <Select
                                            value={ticket.responder_id ? String(ticket.responder_id) : "No agent"}
                                            onValueChange={(value) => updateTicket('responder_id', value)}
                                            disabled={isUpdating.responder_id || Object.keys(availableAgents).length === 0}
                                        >
                                            <SelectTrigger className="w-25 h-6 text-xs min-h-0 py-0 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800">
                                                <SelectValue>
                                                    {isUpdating.responder_id ? "..." :
                                                    (ticket.responder_id ?
                                                    (availableAgents[ticket.responder_id]?.length > 7 ?
                                                    availableAgents[ticket.responder_id].substring(0, 7) + "..." :
                                                    availableAgents[ticket.responder_id]) :
                                                    "No agent")}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="No agent" className="text-xs">No agent</SelectItem>
                                                {Object.entries(availableAgents).map(([key, value]) => (
                                                    <SelectItem key={key} value={key} className="text-xs">{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs py-1 px-2">
                                    <p>Agent</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
