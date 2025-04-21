import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PaperclipIcon, Loader2 } from "lucide-react";
import ticketService from "@/services/ticketService";
import { showSuccessToast, showErrorToast, ToastContainer } from "../../utils/toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import RichTextEditor from "@/utils/RichTextEditor";
import groupService from "@/services/groupService";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "../../utils/Sidebar";
import Header from "../../utils/Header";
import { ErrorProvider, useError } from "../../contexts/ErrorContext";
import { useData } from "../../contexts/DataContext";

const TicketCreateContent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();
    const location = useLocation();
    const { statusMap, priorityMap, sourceMap, typeArray, agentMap, contactMap, contactEmailMap, groupMap } = useData();

    const [ticketData, setTicketData] = useState({
        subject: "",
        description: "",
        status: "2",
        priority: "1",
        source: "2",
        requester_id: location.state?.contactId ? String(location.state.contactId) : null,
        type: null,
        tags: []
    });

    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [availableAgents, setAvailableAgents] = useState({});
    const [errors, setErrors] = useState({});
    const [isTouched, setIsTouched] = useState({});

    useEffect(() => {
        const fetchGroupAgents = async () => {
            if (ticketData.group_id) {
                try {
                    const groupAgents = await groupService.getGroupAgents(ticketData.group_id);
                    const filteredAgents = groupAgents.agent_ids.reduce((acc, id) => {
                        if (agentMap[id]) {
                            acc[id] = agentMap[id];
                        }
                        return acc;
                    }, {});
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
    }, [ticketData.group_id, agentMap, handleError]);

    const handleChange = (field, value) => {
        setIsTouched(prev => ({ ...prev, [field]: true }));

        if (value === null || value === "null") {
            const newData = { ...ticketData };
            delete newData[field];
            setTicketData(newData);
        } else {
            setTicketData({
                ...ticketData,
                [field]: value
            });

            if (field === 'group_id') {
                setTicketData(prev => {
                    const newData = { ...prev, group_id: value };
                    delete newData.responder_id;
                    return newData;
                });
            }
        }

        if (errors[field]) {
            setErrors(prev => {
                const updatedErrors = {...prev};
                delete updatedErrors[field];
                return updatedErrors;
            });
        }
    };

    const handleBlur = (field) => {
        setIsTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field) => {
        let newErrors = { ...errors };

        switch (field) {
            case 'subject':
                if (!ticketData.subject) {
                    newErrors.subject = "Subject is required";
                } else {
                    delete newErrors.subject;
                }
                break;
            case 'description':
                if (!ticketData.description) {
                    newErrors.description = "Description is required";
                } else {
                    delete newErrors.description;
                }
                break;
            case 'requester_id':
                if (!ticketData.requester_id) {
                    newErrors.requester_id = "Contact is required";
                } else {
                    delete newErrors.requester_id;
                }
                break;
            case 'source':
                const validSources = ["1", "2", "3", "5", "6", "7", "9", "10"];
                if (!validSources.includes(ticketData.source)) {
                    newErrors.source = "Source value is invalid";
                } else {
                    delete newErrors.source;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return !newErrors[field];
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!ticketData.tags.includes(tagInput.trim())) {
                setTicketData({
                    ...ticketData,
                    tags: [...ticketData.tags, tagInput.trim()]
                });
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        const updatedTags = ticketData.tags.filter(tag => tag !== tagToRemove);
        setTicketData({
            ...ticketData,
            tags: updatedTags
        });
    };

    const validateForm = () => {
        const allTouched = Object.keys(ticketData).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setIsTouched(allTouched);

        const newErrors = {};

        if (!ticketData.subject) {
            newErrors.subject = "Subject is required";
        }

        if (!ticketData.description) {
            newErrors.description = "Description is required";
        }

        if (!ticketData.requester_id) {
            newErrors.requester_id = "Contact is required";
        }

        const validSources = ["1", "2", "3", "5", "6", "7", "9", "10"];
        if (!validSources.includes(ticketData.source)) {
            newErrors.source = "Source value is invalid. Please select a valid source.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData = {
            ...ticketData,
            status: parseInt(ticketData.status, 10),
            priority: parseInt(ticketData.priority, 10),
            source: parseInt(ticketData.source, 10),
            requester_id: parseInt(ticketData.requester_id, 10)
        };

        if (ticketData.group_id) {
            submitData.group_id = parseInt(ticketData.group_id, 10);
        }
        if (ticketData.responder_id) {
            submitData.responder_id = parseInt(ticketData.responder_id, 10);
        }

        try {
            setLoading(true);
            const result = await ticketService.createTicket(submitData, attachments);
            showSuccessToast("Ticket created successfully!");

            setTicketData({
                subject: "",
                description: "",
                status: "2",
                priority: "1",
                source: "2",
                requester_id: null,
                type: null,
                tags: []
            });
            setAttachments([]);
            setTagInput("");

            navigate("/tickets");
        } catch (error) {
            showErrorToast(error.message || "Failed to create ticket");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-grow">
                <Header
                    title="Create New Ticket"
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />

                <main className="flex-grow p-6 overflow-auto">
                    <Card className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="contact" className="required mb-2">Contact *</Label>
                                    <Select
                                        value={ticketData.requester_id || ""}
                                        onValueChange={(value) => handleChange("requester_id", value)}
                                    >
                                        <SelectTrigger
                                            id="contact"
                                            className={isTouched.requester_id && errors.requester_id ? "border-red-500" : ""}
                                            onBlur={() => handleBlur("requester_id")}
                                        >
                                            <SelectValue placeholder="Select contact" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(contactMap).map(([contactId, contactName]) => (
                                                <SelectItem key={contactId} value={contactId}>
                                                    {contactName} {contactEmailMap[contactId] ? `<${contactEmailMap[contactId]}>` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {isTouched.requester_id && errors.requester_id &&
                                        <p className="text-sm text-red-500 mt-1">{errors.requester_id}</p>
                                    }
                                </div>

                                <div>
                                    <Label htmlFor="subject" className="required mb-2">Subject *</Label>
                                    <Input
                                        id="subject"
                                        value={ticketData.subject}
                                        onChange={(e) => handleChange("subject", e.target.value)}
                                        onBlur={() => handleBlur("subject")}
                                        placeholder="Enter ticket subject"
                                        className={isTouched.subject && errors.subject ? "border-red-500" : ""}
                                    />
                                    {isTouched.subject && errors.subject &&
                                        <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
                                    }
                                </div>

                                <div>
                                    <Label htmlFor="description" className="required mb-2">Description *</Label>
                                    <RichTextEditor
                                        value={ticketData.description}
                                        onChange={(value) => {
                                            setTicketData(prevData => ({
                                                ...prevData,
                                                description: value
                                            }));

                                            if (isTouched.description && errors.description) {
                                                setErrors(prev => {
                                                    const updatedErrors = {...prev};
                                                    if (value) delete updatedErrors.description;
                                                    return updatedErrors;
                                                });
                                            }
                                        }}
                                        onBlur={() => handleBlur("description")}
                                        className={isTouched.description && errors.description ? "border-red-500" : ""}
                                    />
                                    {isTouched.description && errors.description &&
                                        <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                                    }
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format your text using the toolbar above. You can also upload images, insert tables, and add code blocks.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="status" className="required mb-2">Status *</Label>
                                        <Select
                                            value={ticketData.status}
                                            onValueChange={(value) => handleChange("status", value)}
                                        >
                                            <SelectTrigger id="status">
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
                                        <Label htmlFor="priority" className="required mb-2">Priority *</Label>
                                        <Select
                                            value={ticketData.priority}
                                            onValueChange={(value) => handleChange("priority", value)}
                                        >
                                            <SelectTrigger id="priority">
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

                                <div>
                                    <Label htmlFor="type" className="mb-2">Type</Label>
                                    <Select
                                        value={ticketData.type || ""}
                                        onValueChange={(value) => handleChange("type", value)}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeArray.map((type, index) => (
                                                <SelectItem key={index} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="group" className="mb-2">Group</Label>
                                        <Select
                                            value={ticketData.group_id || "null"}
                                            onValueChange={(value) => handleChange("group_id", value === "null" ? null : value)}
                                        >
                                            <SelectTrigger id="group">
                                                <SelectValue placeholder="Select group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">None</SelectItem>
                                                {Object.entries(groupMap).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="agent" className="mb-2">Agent</Label>
                                        <Select
                                            value={ticketData.responder_id || "null"}
                                            onValueChange={(value) => handleChange("responder_id", value === "null" ? null : value)}
                                            disabled={Object.keys(availableAgents).length === 0}
                                        >
                                            <SelectTrigger id="agent">
                                                <SelectValue placeholder="Select agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">None</SelectItem>
                                                {Object.entries(availableAgents).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="source" className="mb-2">Source</Label>
                                    <Select
                                        value={ticketData.source}
                                        onValueChange={(value) => handleChange("source", value)}
                                        onBlur={() => handleBlur("source")}
                                    >
                                        <SelectTrigger id="source" className={isTouched.source && errors.source ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(sourceMap)
                                                .filter(([key]) => ["1", "2", "3", "5", "6", "7", "9", "10"].includes(key))
                                                .map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                    {isTouched.source && errors.source &&
                                        <p className="text-sm text-red-500 mt-1">{errors.source}</p>
                                    }
                                </div>

                                <div>
                                    <Label htmlFor="tags" className="mb-2">Tags</Label>
                                    <div className="flex flex-col space-y-2">
                                        <Input
                                            id="tags"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            placeholder="Add tag and press Enter"
                                        />
                                        {ticketData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {ticketData.tags.map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTag(tag)}
                                                            className="focus:outline-none"
                                                        >
                                                            <X className="h-3 w-3 cursor-pointer" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2">Attachments</Label>
                                    <div className="mt-1">
                                        <label className="block">
                                            <span className="sr-only">Choose files</span>
                                            <Input
                                                type="file"
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                multiple
                                                onChange={handleFileChange}
                                            />
                                        </label>

                                        {attachments.length > 0 && (
                                            <div className="mt-2">
                                                <h4 className="text-sm font-medium">Attached Files:</h4>
                                                <ul className="mt-1 space-y-1">
                                                    {attachments.map((file, index) => (
                                                        <li key={index} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center">
                                                                <PaperclipIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                                <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeAttachment(index)}
                                                                className="text-red-500"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/tickets")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Ticket"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};

const TicketCreate = () => {
    return (
        <ErrorProvider>
            <TicketCreateContent />
        </ErrorProvider>
    );
};

export default TicketCreate;
