import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, isAfter } from 'date-fns';
import { Edit, X, Plus, Calendar, Clock, Tag, Type, BarChart2, Users, User, AlertCircle } from 'lucide-react';
import { showSuccessToast } from '@/utils/toast';
import ticketService from '@/services/ticketService';
import groupService from '@/services/groupService';
import { useError } from '@/contexts/ErrorContext';
import { useData } from '@/contexts/DataContext';

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
    const { agentMap, groupMap, statusMap, priorityMap, typeArray } = useData();

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

            if (ticketProperties.tags) {
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
        <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-full">
                            <BarChart2 className="h-4 w-4 text-blue-700" />
                        </div>
                        Status: <span className="text-blue-600 ml-1">{statusMap[ticket.status] || 'Open'}</span>
                    </h3>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {!isTicketClosed && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center text-sm font-medium mb-2">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${isFirstResponseDuePassed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span className="text-gray-700">FIRST RESPONSE DUE</span>
                                </div>
                                <div className="text-sm text-gray-600 ml-5 flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    {formatDate(ticket.fr_due_by)}
                                </div>
                            </div>

                            <Separator className="my-3 bg-gray-200" />

                            <div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm font-medium mb-2">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${isResolutionDuePassed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                        <span className="text-gray-700">RESOLUTION DUE</span>
                                    </div>
                                    {!editingResolutionDue ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingResolutionDue(true)}
                                            disabled={isUpdating}
                                            className="text-blue-600 hover:text-blue-800 h-7 px-2"
                                        >
                                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingResolutionDue(false)}
                                            disabled={isUpdating}
                                            className="h-7 px-2"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {!editingResolutionDue ? (
                                    <div className="text-sm text-gray-600 ml-5 flex items-center">
                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                        {formatDate(ticket.due_by)}
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal flex items-center h-9"
                                                    >
                                                        <Calendar className="mr-2 h-3.5 w-3.5" />
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
                                                className="h-9"
                                            />
                                        </div>

                                        <Button
                                            size="sm"
                                            className="w-full"
                                            onClick={handleUpdateResolutionDue}
                                            disabled={isUpdating || !resolutionDate}
                                        >
                                            {isUpdating ? 'Updating...' : 'Update Due Date'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-1.5 rounded-full">
                                <Tag className="h-4 w-4 text-purple-700" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Enter tag name"
                                    className="flex-grow h-8 text-sm"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddTag}
                                    disabled={!tagInput.trim()}
                                    className="h-8 px-2"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {ticketProperties.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {ticketProperties.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-blue-700 hover:text-blue-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic mt-1">No tags added</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-full">
                                <Type className="h-4 w-4 text-green-700" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-700">Ticket Properties</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-md space-y-3">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Type:</div>
                                <Select
                                    value={ticketProperties.type}
                                    onValueChange={(value) => setTicketProperties({...ticketProperties, type: value})}
                                >
                                    <SelectTrigger className="w-full h-8 text-sm">
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
                                <div className="text-xs text-gray-500 mb-1">Status:</div>
                                <Select
                                    value={ticketProperties.status}
                                    onValueChange={(value) => setTicketProperties({...ticketProperties, status: value})}
                                >
                                    <SelectTrigger className="w-full h-8 text-sm">
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
                                <div className="text-xs text-gray-500 mb-1">Priority:</div>
                                <Select
                                    value={ticketProperties.priority}
                                    onValueChange={(value) => setTicketProperties({...ticketProperties, priority: value})}
                                >
                                    <SelectTrigger className="w-full h-8 text-sm">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityMap).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-orange-100 p-1.5 rounded-full">
                                <Users className="h-4 w-4 text-orange-700" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-700">Assignment</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-md space-y-3">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Group:</div>
                                <Select
                                    value={ticketProperties.group_id}
                                    onValueChange={(value) => setTicketProperties({
                                        ...ticketProperties,
                                        group_id: value,
                                        responder_id: 'none'
                                    })}
                                >
                                    <SelectTrigger className="w-full h-8 text-sm">
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
                                <div className="text-xs text-gray-500 mb-1">Agent:</div>
                                <Select
                                    value={ticketProperties.responder_id}
                                    onValueChange={(value) => setTicketProperties({...ticketProperties, responder_id: value})}
                                >
                                    <SelectTrigger className="w-full h-8 text-sm">
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
                        </div>
                    </div>

                    {isPropertiesChanged() && (
                        <div className="bg-amber-50 border border-amber-200 p-2 rounded-md flex items-start mt-2">
                            <AlertCircle className="text-amber-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-xs text-amber-800">You have unsaved changes to the ticket properties</p>
                        </div>
                    )}

                    <Button
                        className="w-full"
                        onClick={handleUpdateProperties}
                        disabled={isUpdating || !isPropertiesChanged()}
                    >
                        {isUpdating ? 'Updating...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default TicketProperties;
