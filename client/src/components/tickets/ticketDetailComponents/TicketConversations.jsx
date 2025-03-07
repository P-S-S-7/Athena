import { format, parseISO, formatDistanceToNow, subHours } from 'date-fns';
import { Card } from '@/components/ui/card';
import { agentMap, contactMap } from '@/utils/freshdeskMappings';
import {
    PaperclipIcon, Download, Mail, Forward, Eye, EyeOff,
    MoreVertical, Trash, Edit, Loader2, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import RichTextEditor from '@/utils/RichTextEditor';
import ticketService from '@/services/ticketService';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
        const date = parseISO(dateString);
        const estDate = subHours(date, 5);
        return format(estDate, 'MMM d, yyyy h:mm a');
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Invalid date';
    }
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
        return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
        return '';
    }
};

const formatTimeWithParentheses = (dateString) => {
    if (!dateString) return '';
    try {
        return `(${format(parseISO(dateString), 'EEE, d MMM yyyy')}) at ${format(parseISO(dateString), 'h:mm a')}`;
    } catch (error) {
        return '';
    }
};

const stripRTLDirectives = (html) => {
    if (!html) return '';
    return html.replace(/dir="(rtl|ltr)"/gi, '');
};

const TicketConversations = ({ conversations = [], ticketId, onRefresh }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAllConversations, setShowAllConversations] = useState(false);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editingAttachments, setEditingAttachments] = useState([]);
    const [newAttachments, setNewAttachments] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    const sortedConversations = [...conversations].sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
    });

    const hasMoreConversations = conversations.length > 3;

    const recentConversations = [...sortedConversations].slice(-3);

    const olderConversations = [...sortedConversations].slice(0, -3);

    const displayedConversations = showAllConversations
        ? sortedConversations
        : recentConversations;

    useEffect(() => {
        const addStylesToLinks = () => {
            const links = document.querySelectorAll('.conversation-body a');
            links.forEach(link => {
                link.style.color = '#2563eb';
                link.style.textDecoration = 'underline';
                link.style.fontStyle = 'italic';
            });
        };

        const styleListElements = () => {
            const unorderedLists = document.querySelectorAll('.conversation-body ul');
            unorderedLists.forEach(list => {
                list.style.listStyleType = 'disc';
                list.style.paddingLeft = '1.5rem';
                list.style.marginBottom = '1rem';
            });

            const orderedLists = document.querySelectorAll('.conversation-body ol');
            orderedLists.forEach(list => {
                list.style.listStyleType = 'decimal';
                list.style.paddingLeft = '1.5rem';
                list.style.marginBottom = '1rem';
            });

            const listItems = document.querySelectorAll('.conversation-body li');
            listItems.forEach(item => {
                item.style.marginBottom = '0.25rem';
            });
        };

        if (displayedConversations.length > 0) {
            setTimeout(() => {
                addStylesToLinks();
                styleListElements();
            }, 100);
        }
    }, [displayedConversations]);

    const handleDeleteClick = (conversation) => {
        setDeleteTarget(conversation);
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (conversation) => {
        setEditTarget(conversation);
        const cleanContent = stripRTLDirectives(conversation.body || conversation.body_text || '');
        setEditContent(cleanContent);
        setEditingAttachments(conversation.attachments || []);
        setNewAttachments([]);
        setEditDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await ticketService.deleteConversation(deleteTarget.id);

            showSuccessToast(`${deleteTarget.source === 2 ? 'Note' : 'Reply'} deleted successfully`);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error deleting conversation:", error);
            showErrorToast(`Failed to delete: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewAttachments([...newAttachments, ...files]);
    };

    const removeNewAttachment = (index) => {
        setNewAttachments(newAttachments.filter((_, i) => i !== index));
    };

    const confirmEdit = async () => {
        if (!editTarget) return;

        setIsEditing(true);
        try {
            const finalContent = stripRTLDirectives(editContent);

            const formData = new FormData();
            formData.append('body', finalContent);

            if (newAttachments.length > 0) {
                newAttachments.forEach((file, index) => {
                    formData.append(`attachments[${index}]`, file);
                });
            }

            await ticketService.updateConversation(editTarget.id, formData);

            showSuccessToast("Note updated successfully");

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error updating note:", error);
            showErrorToast(`Failed to update: ${error.message || 'Unknown error'}`);
        } finally {
            setIsEditing(false);
            setEditDialogOpen(false);
            setEditTarget(null);
            setEditContent('');
            setEditingAttachments([]);
            setNewAttachments([]);
        }
    };

    const toggleShowAllConversations = () => {
        setShowAllConversations(!showAllConversations);
    };

    if (conversations.length === 0) {
        return null;
    }

    const renderConversation = (conversation, index) => {
        const isReply = conversation.source === 0;
        const isForward = conversation.source === 8;
        const isPrivateNote = conversation.source === 2 && conversation.private === true;
        const isPublicNote = conversation.source === 2 && conversation.private === false;
        const isNote = isPrivateNote || isPublicNote;

        const userName = conversation.user_id
            ? agentMap[conversation.user_id] || 'Agent'
            : contactMap[conversation.contact_id] || 'Contact';

        const userInitial = userName.charAt(0).toUpperCase();
        const timeAgo = formatRelativeTime(conversation.created_at);
        const timeWithDate = formatTimeWithParentheses(conversation.created_at);

        let bgColor = 'bg-white';
        if (isPrivateNote) bgColor = 'bg-yellow-50';
        if (isForward) bgColor = 'bg-blue-50';

        const canEdit = isNote;
        const canDelete = isNote || isReply;

        const hasPendingEmails = conversation.delivery_details?.pending_emails?.length > 0;
        const hasFailedEmails = conversation.delivery_details?.failed_emails?.length > 0;

        return (
            <Card key={conversation.id || index} className={`p-4 mb-4 ${bgColor}`}>
                {hasFailedEmails && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md shadow-sm">
                        <p className="text-red-700 font-medium text-sm">
                            Failed to deliver to: {conversation.delivery_details.failed_emails.join(', ')}
                        </p>
                    </div>
                )}

                {hasPendingEmails && (
                    <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded-md shadow-sm">
                        <p className="text-orange-700 font-medium text-sm">
                            Pending delivery to: {conversation.delivery_details.pending_emails.join(', ')}
                        </p>
                    </div>
                )}

                <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className={`${isPrivateNote ? 'bg-yellow-300' : isForward ? 'bg-blue-300' : 'bg-cyan-500'} text-white`}>
                            {userInitial}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="font-medium text-blue-600">{userName}</span>
                                <span className="ml-2 text-gray-700">
                                    {isReply && 'replied'}
                                    {isPrivateNote && 'added a private note'}
                                    {isPublicNote && 'added a public note'}
                                    {isForward && 'forwarded'}
                                </span>
                            </div>

                            {(canEdit || canDelete) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {canEdit && (
                                            <DropdownMenuItem onClick={() => handleEditClick(conversation)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                        )}
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteClick(conversation)}
                                                className="text-red-600"
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="text-sm text-gray-500 mb-3">
                            {timeAgo} {timeWithDate}
                        </div>

                        {isReply && conversation.to_emails && (
                            <div className="flex items-center mb-2 text-gray-600 text-sm">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                To: {typeof conversation.to_emails === 'string'
                                    ? conversation.to_emails
                                    : Array.isArray(conversation.to_emails)
                                        ? conversation.to_emails.join(', ')
                                        : JSON.stringify(conversation.to_emails)}
                            </div>
                        )}

                        {isForward && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg shadow-sm text-gray-700 mb-4">
                                <div className="flex items-center mb-1">
                                    <Forward className="h-4 w-4 text-blue-600 mr-2" />
                                    <span className="font-semibold text-blue-700">Forwarded To:</span>
                                    <span className="ml-2 text-gray-800">
                                        {Array.isArray(conversation.to_emails)
                                            ? conversation.to_emails.join(', ')
                                            : conversation.to_emails || conversation.forward_emails || "Unknown recipient"}
                                    </span>
                                </div>

                                {conversation.cc_emails && conversation.cc_emails.length > 0 && (
                                    <div className="flex items-center mb-1">
                                        <Forward className="h-4 w-4 text-gray-600 mr-2" />
                                        <span className="font-semibold text-gray-700">Cc:</span>
                                        <span className="ml-2 text-gray-800">
                                            {Array.isArray(conversation.cc_emails)
                                                ? conversation.cc_emails.join(', ')
                                                : JSON.stringify(conversation.cc_emails)}
                                        </span>
                                    </div>
                                )}

                                {conversation.bcc_emails && conversation.bcc_emails.length > 0 && (
                                    <div className="flex items-center">
                                        <Forward className="h-4 w-4 text-gray-600 mr-2" />
                                        <span className="font-semibold text-gray-700">Bcc:</span>
                                        <span className="ml-2 text-gray-800">
                                            {Array.isArray(conversation.bcc_emails)
                                                ? conversation.bcc_emails.join(', ')
                                                : JSON.stringify(conversation.bcc_emails)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(isPrivateNote || isPublicNote) && (
                            <div className="flex items-center mb-3">
                                <Badge
                                    variant="outline"
                                    className={`flex items-center gap-1 ${isPrivateNote ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                                >
                                    {isPrivateNote ? (
                                        <>
                                            <EyeOff className="h-3 w-3" />
                                            <span>Private Note</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-3 w-3" />
                                            <span>Public Note</span>
                                        </>
                                    )}
                                </Badge>
                            </div>
                        )}

                        <div
                            className="conversation-body prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: conversation.body || conversation.body_text }}
                        />

                        {conversation.attachments && conversation.attachments.length > 0 && (
                            <div className="mt-3 p-2 bg-gray-100 rounded-lg border border-gray-300">
                                <h3 className="text-sm font-semibold mb-2 text-gray-700">Attachments:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {conversation.attachments.map((attachment, idx) => {
                                        const downloadFile = (e) => {
                                            e.preventDefault();
                                            const downloadLink = document.createElement('a');
                                            downloadLink.href = attachment.attachment_url;
                                            downloadLink.download = attachment.name;
                                            downloadLink.target = '_blank';
                                            downloadLink.rel = 'noopener noreferrer';
                                            document.body.appendChild(downloadLink);
                                            downloadLink.click();
                                            document.body.removeChild(downloadLink);
                                        };

                                        const openLink = () => {
                                            window.open(attachment.attachment_url, '_blank');
                                        };

                                        return (
                                            <div key={idx} className="flex items-center p-2 rounded-lg bg-white border border-gray-300 shadow-sm hover:shadow-md transition-all">
                                                <PaperclipIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                <span
                                                    className="text-sm font-medium cursor-pointer text-blue-600 hover:underline"
                                                    onClick={openLink}
                                                >
                                                    {attachment.name}
                                                </span>
                                                <button
                                                    onClick={downloadFile}
                                                    className="ml-2 text-blue-600 hover:text-blue-700"
                                                    title="Download file"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <>
            {hasMoreConversations && (
                <div className="flex justify-center mb-4 border-b border-gray-200 pb-2">
                    <Button
                        variant="ghost"
                        onClick={toggleShowAllConversations}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        size="sm"
                    >
                        {showAllConversations ? (
                            <>
                                <ChevronUp className="h-4 w-4" />
                                <span>Show recent conversations</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                <span>+{conversations.length - 3} conversations</span>
                            </>
                        )}
                    </Button>
                </div>
            )}

            {showAllConversations && olderConversations.length > 0 && (
                olderConversations.map(renderConversation)
            )}

            {recentConversations.map(renderConversation)}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this
                            {deleteTarget?.source === 2 ? ' note' : ' reply'}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 focus:ring-red-600"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Note</DialogTitle>
                        <DialogDescription>
                            Update the content of your note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <RichTextEditor
                                value={editContent}
                                onChange={setEditContent}
                                className="min-h-[200px]"
                                direction="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Current Attachments:</h4>
                            {editingAttachments.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {editingAttachments.map((attachment, idx) => (
                                        <div key={idx} className="flex items-center text-sm bg-gray-100 p-2 rounded">
                                            <PaperclipIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{attachment.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No attachments</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Add New Attachments:</h4>
                            <Input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />

                            {newAttachments.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    <h4 className="text-sm font-medium">New Attachments to Upload:</h4>
                                    <div className="space-y-1">
                                        {newAttachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center">
                                                    <PaperclipIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                    <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeNewAttachment(idx)}
                                                    className="text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={isEditing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmEdit}
                            disabled={isEditing || !editContent.trim()}
                        >
                            {isEditing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TicketConversations;
