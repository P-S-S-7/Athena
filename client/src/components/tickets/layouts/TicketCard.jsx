import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Clock, User, Calendar } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { contactMap } from "@/utils/freshdeskMappings";
import ticketService from "@/services/ticketService";
import groupService from "@/services/groupService";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

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
                    console.error("Error fetching group agents:", error);
                    setAvailableAgents({});
                }
            } else {
                setAvailableAgents(agents);
            }
        };

        fetchGroupAgents(ticket.group_id);
    }, [ticket.group_id]);

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

            const response = await ticketService.updateTicket(ticket.id, ticketData);

            const updatedTicket = { ...ticket, ...ticketData };
            setTicket(updatedTicket);

            if (onTicketUpdate) {
                onTicketUpdate(updatedTicket);
            }

            showSuccessToast("Ticket updated successfully");
        } catch (error) {
            console.error("Error updating ticket:", error);
            showErrorToast("Failed to update ticket");
        } finally {
            setIsUpdating(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    function getPriorityColor(priority) {
        const colors = {
            1: "bg-green-200 text-green-900 border-green-300",
            2: "bg-blue-200 text-blue-900 border-blue-300",
            3: "bg-yellow-200 text-yellow-900 border-yellow-300",
            4: "bg-red-200 text-red-900 border-red-300",
        };
        return colors[priority] || "bg-gray-200 text-gray-900 border-gray-300";
    }

    const getStatusColor = (status) => {
        const colors = {
            2: "bg-yellow-200 text-yellow-900 border-yellow-300",
            3: "bg-purple-200 text-purple-900 border-purple-300",
            4: "bg-green-200 text-green-900 border-green-300",
            5: "bg-gray-200 text-gray-900 border-gray-300",
        };
        return colors[status] || "bg-gray-200 text-gray-900 border-gray-300";
    };

    const navigateToTicketDetails = (e, ticketId) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/tickets/${ticketId}`);
    };

    return (
        <Card
            className={`mb-3 hover:border-blue-400 transition-transform duration-200 ${selected ? "border-blue-600 shadow-lg" : "border border-gray-300 shadow-md"} ${isClosed ? "opacity-70 grayscale" : ""}`}
        >
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <Checkbox
                            checked={selected}
                            onCheckedChange={onSelect}
                            className="mr-3 h-5 w-5"
                        />
                        <span className="text-sm font-semibold text-gray-700" onClick={(e) => navigateToTicketDetails(e, ticket.id)}>
                            {ticket.subject.length > 80 ? `${ticket.subject.substring(0, ticket.subject.lastIndexOf(' ', 80))}...` : ticket.subject} #{ticket.id}
                        </span>
                    </div>

                    <div className="flex items-center justify-end space-x-1">
                        {isNew && (
                            <Badge className="text-[10px] py-1 px-2 rounded-md bg-green-200 text-green-900 hover:bg-green-300 transition-colors">
                                New
                            </Badge>
                        )}
                        {isOverdue && (
                            <Badge className="text-[10px] py-1 px-2 rounded-md bg-red-200 text-red-900 hover:bg-red-300 transition-colors">
                                Overdue
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <User className="mr-1.5 h-4 w-4" />
                        <span className="truncate">{contactMap[ticket.requester_id] || "Unknown"}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        <span className="truncate">
                            {"Created: "}
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    {ticket.due_by && (
                        <div className="flex items-center text-sm col-span-2 mt-1">
                            <Clock className={`mr-1.5 h-4 w-4 ${isOverdue ? "text-red-600" : "text-gray-500"}`} />
                            <span className={`truncate ${isOverdue ? "text-red-700" : "text-gray-600"}`}>
                                {isOverdue ? "Overdue: " : "Due: "}
                                {formatDistanceToNow(new Date(ticket.due_by), { addSuffix: true })}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div>
                        {ticket.source && (
                            <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-gray-100">
                                {sources[ticket.source] || "Unknown"}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Select
                            value={String(ticket.priority)}
                            onValueChange={(value) => updateTicket('priority', value)}
                            disabled={isUpdating.priority}
                        >
                            <SelectTrigger className={`w-28 h-8 text-sm min-h-0 py-1 ${getPriorityColor(ticket.priority)}`}>
                                <SelectValue>
                                    {isUpdating.priority ? "..." : priorities[ticket.priority]}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(priorities).map(([key, value]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(ticket.status)}
                            onValueChange={(value) => updateTicket('status', value)}
                            disabled={isUpdating.status}
                        >
                            <SelectTrigger className={`w-28 h-8 text-sm min-h-0 py-1 ${getStatusColor(ticket.status)}`}>
                                <SelectValue>
                                    {isUpdating.status ? "..." : statuses[ticket.status]}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statuses).map(([key, value]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={ticket.group_id ? String(ticket.group_id) : "None"}
                            onValueChange={(value) => {
                                updateTicket('group_id', value);
                                if (value !== "None") {
                                    setAvailableAgents(currentAgents => ({
                                        ...currentAgents,
                                        responder_id: null
                                    }));
                                }
                            }}
                            disabled={isUpdating.group_id}
                        >
                            <SelectTrigger className="w-28 h-8 text-sm min-h-0 py-1">
                                <SelectValue>
                                    {isUpdating.group_id ? "..." :
                                     (ticket.group_id ?
                                      (groups[ticket.group_id]?.length > 10 ?
                                       groups[ticket.group_id].substring(0, 10) + "..." :
                                       groups[ticket.group_id]) :
                                      "None")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None" className="text-xs">
                                    None
                                </SelectItem>
                                {Object.entries(groups).map(([key, value]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={ticket.responder_id ? String(ticket.responder_id) : "None"}
                            onValueChange={(value) => updateTicket('responder_id', value)}
                            disabled={isUpdating.responder_id || Object.keys(availableAgents).length === 0}
                        >
                            <SelectTrigger className="w-28 h-8 text-sm min-h-0 py-1">
                                <SelectValue>
                                    {isUpdating.responder_id ? "..." :
                                     (ticket.responder_id ?
                                      (availableAgents[ticket.responder_id]?.length > 10 ?
                                       availableAgents[ticket.responder_id].substring(0, 10) + "..." :
                                       availableAgents[ticket.responder_id]) :
                                      "None")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None" className="text-xs">
                                    None
                                </SelectItem>
                                {Object.entries(availableAgents).map(([key, value]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TicketCard;
