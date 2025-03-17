import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, addHours, isAfter } from 'date-fns';
import { Edit, X, Plus, Calendar } from 'lucide-react';
import { showSuccessToast } from '@/utils/toast';
import { statusMap, priorityMap, typeArray, agentMap, groupMap } from '@/utils/freshdeskMappings';
import ticketService from '@/services/ticketService';
import groupService from '@/services/groupService';
import { useError } from '@/contexts/ErrorContext';

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

const isDueDatePassed = (dateString) => {
    if (!dateString) return false;
    try {
        const dueDate = parseISO(dateString);
        return !isAfter(dueDate, new Date());
    } catch (error) {
        return false;
    }
};

const TicketProperties = ({ ticket, isTicketClosed, onRefresh }) => {
    const { handleError } = useError();
    const [editingResolutionDue, setEditingResolutionDue] = useState(false);
    const [ticketProperties, setTicketProperties] = useState({
        status: '',
        priority: '',
        type: '',
        group_id: '',
        responder_id: '',
        tags: []
    });
    const [originalProperties, setOriginalProperties] = useState({});
    const [resolutionDate, setResolutionDate] = useState(null);
    const [resolutionTime, setResolutionTime] = useState('12:00');
    const [isUpdating, setIsUpdating] = useState(false);
    const [availableAgents, setAvailableAgents] = useState({});
    const [tagInput, setTagInput] = useState('');

    const isFirstResponseDuePassed = isDueDatePassed(ticket?.fr_due_by);
    const isResolutionDuePassed = isDueDatePassed(ticket?.due_by);

    useEffect(() => {
        if (ticket) {
            const properties = {
                status: String(ticket.status),
                priority: String(ticket.priority),
                type: ticket.type || 'none',
                group_id: ticket.group_id ? String(ticket.group_id) : 'none',
                responder_id: ticket.responder_id ? String(ticket.responder_id) : 'none',
                tags: ticket.tags || []
            };

            setTicketProperties(properties);
            setOriginalProperties(properties);

            if (ticket.due_by) {
                const dueDate = parseISO(ticket.due_by);
                setResolutionDate(dueDate);
                setResolutionTime(format(dueDate, 'HH:mm'));
            }
        }
    }, [ticket]);

    useEffect(() => {
        const fetchGroupAgents = async () => {
            if (ticketProperties.group_id && ticketProperties.group_id !== 'none') {
                try {
                    const groupAgents = await groupService.getGroupAgents(ticketProperties.group_id);
                    const filteredAgents = {};

                    if (groupAgents && groupAgents.agent_ids) {
                        groupAgents.agent_ids.forEach(id => {
                            if (agentMap[id]) {
                                filteredAgents[id] = agentMap[id];
                            }
                        });
                    }

                    setAvailableAgents(filteredAgents);
                } catch (error) {
                    handleError(error);
                    setAvailableAgents({});
                }
            } else {
                setAvailableAgents(agentMap);
            }
        };

        fetchGroupAgents();
    }, [ticketProperties.group_id, handleError]);

    const isPropertiesChanged = () => {
        return JSON.stringify(ticketProperties) !== JSON.stringify(originalProperties);
    };

    const handleUpdateProperties = async () => {
        try {
            setIsUpdating(true);

            const updatedData = {
                status: parseInt(ticketProperties.status, 10),
                priority: parseInt(ticketProperties.priority, 10)
            };

            if (ticketProperties.type && ticketProperties.type !== 'none') {
                updatedData.type = ticketProperties.type;
            } else {
                updatedData.type = null;
            }

            if (ticketProperties.tags && ticketProperties.tags.length > 0) {
                updatedData.tags = ticketProperties.tags;
            }

            if (ticketProperties.group_id && ticketProperties.group_id !== 'none') {
                updatedData.group_id = parseInt(ticketProperties.group_id, 10);
            } else {
                updatedData.group_id = null;
            }

            if (ticketProperties.responder_id && ticketProperties.responder_id !== 'none') {
                updatedData.responder_id = parseInt(ticketProperties.responder_id, 10);
            } else {
                updatedData.responder_id = null;
            }

            await ticketService.updateTicket(ticket.id, updatedData);
            showSuccessToast('Ticket properties updated successfully');
            setOriginalProperties({...ticketProperties});

            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateResolutionDue = async () => {
        if (!resolutionDate) {
            handleError(new Error('Please select a date'));
            return;
        }

        try {
            setIsUpdating(true);

            const [hours, minutes] = resolutionTime.split(':').map(Number);

            const localDueDate = new Date(resolutionDate);
            localDueDate.setHours(hours, minutes, 0, 0);

            await ticketService.updateTicket(ticket.id, {
                due_by: localDueDate.toISOString()
            });

            setTimeout(() => showSuccessToast('Resolution due date updated successfully'), 1000);
            setEditingResolutionDue(false);

            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddTag = () => {
        if (!tagInput.trim()) return;

        if (!ticketProperties.tags.includes(tagInput.trim())) {
            setTicketProperties({
                ...ticketProperties,
                tags: [...ticketProperties.tags, tagInput.trim()]
            });
        }

        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setTicketProperties({
            ...ticketProperties,
            tags: ticketProperties.tags.filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Status: <span className="text-blue-600">{statusMap[ticket.status] || 'Open'}</span></h3>
            </div>

            <div className="space-y-4">
                {!isTicketClosed && (
                    <>
                        <div>
                            <div className="flex items-center text-sm font-medium mb-1">
                                <div className={`w-3 h-3 rounded-full mr-2 ${isFirstResponseDuePassed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                FIRST RESPONSE DUE
                            </div>
                            <div className="text-sm text-gray-600 ml-5">
                                by {formatDate(ticket.fr_due_by)}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-sm font-medium mb-1">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${isResolutionDuePassed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    RESOLUTION DUE
                                </div>
                                {!editingResolutionDue ? (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingResolutionDue(true)} disabled={isUpdating} className="text-blue-600 hover:text-blue-800">
                                        Edit
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingResolutionDue(false)} disabled={isUpdating}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {!editingResolutionDue ? (
                                <div className="text-sm text-gray-600 ml-5">
                                    by {formatDate(ticket.due_by)}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-1 gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal flex items-center"
                                                >
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {resolutionDate ? format(resolutionDate, 'PPP') : "Select a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={resolutionDate}
                                                    onSelect={setResolutionDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Input
                                            type="time"
                                            value={resolutionTime}
                                            onChange={(e) => setResolutionTime(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleUpdateResolutionDue}
                                        disabled={isUpdating || !resolutionDate}
                                    >
                                        {isUpdating ? 'Updating...' : 'Update Due Date'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <Separator />

                <div className="space-y-3">
                    <div>
                        <div className="text-sm font-medium mb-1">Tags:</div>
                        <div className="flex flex-col space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Enter tag name"
                                    className="flex-grow"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleAddTag}
                                    disabled={!tagInput.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {ticketProperties.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {ticketProperties.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="flex items-center gap-1"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-medium mb-1">Type:</div>
                        <Select
                            value={ticketProperties.type}
                            onValueChange={(value) => setTicketProperties({...ticketProperties, type: value})}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {typeArray.map((type, index) => (
                                    <SelectItem key={index} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <div className="text-sm font-medium mb-1">Status:</div>
                        <Select
                            value={ticketProperties.status}
                            onValueChange={(value) => setTicketProperties({...ticketProperties, status: value})}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statusMap).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <div className="text-sm font-medium mb-1">Priority:</div>
                        <Select
                            value={ticketProperties.priority}
                            onValueChange={(value) => setTicketProperties({...ticketProperties, priority: value})}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(priorityMap).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <div className="text-sm font-medium mb-1">Group:</div>
                        <Select
                            value={ticketProperties.group_id}
                            onValueChange={(value) => setTicketProperties({
                                ...ticketProperties,
                                group_id: value,
                                responder_id: 'none'
                            })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {Object.entries(groupMap).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <div className="text-sm font-medium mb-1">Agent:</div>
                        <Select
                            value={ticketProperties.responder_id}
                            onValueChange={(value) => setTicketProperties({...ticketProperties, responder_id: value})}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {Object.entries(availableAgents).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleUpdateProperties}
                        disabled={isUpdating || !isPropertiesChanged()}
                    >
                        {isUpdating ? 'Updating...' : 'Update'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default TicketProperties;
