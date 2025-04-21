import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import {
    PaperclipIcon, Download, Mail, Forward, Eye, EyeOff,
    MoreVertical, Trash, Edit, Loader2, X, ChevronDown, ChevronUp,
    Reply, AlertCircle, Clock
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { showSuccessToast } from '@/utils/toast';
import { useError } from '@/contexts/ErrorContext';
import { useData } from '@/contexts/DataContext';

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

const TicketConversations = ({ conversations = [], ticketId, user, onRefresh }) => {
    const { handleError } = useError();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAllConversations, setShowAllConversations] = useState(false);
    const [expandedQuotes, setExpandedQuotes] = useState({});

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [headerText, setHeaderText] = useState('');
    const [editingAttachments, setEditingAttachments] = useState([]);
    const [newAttachments, setNewAttachments] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const { contactMap, agentMap } = useData();

    const sortedConversations = [...conversations].sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
    });

    const hasMoreConversations = conversations.length > 3;

    const recentConversations = [...sortedConversations].slice(-3);

    const olderConversations = [...sortedConversations].slice(0, -3);

    const displayedConversations = showAllConversations
        ? sortedConversations
        : recentConversations;

    const toggleQuoteVisibility = (conversationId) => {
        setExpandedQuotes(prev => ({
            ...prev,
            [conversationId]: !prev[conversationId]
        }));
    };

    const splitQuotedContent = (html) => {
        if (!html) return { mainContent: '', quotedContent: '' };

        const quoteMatch = html.match(/(<[^>]*>)*\s*On\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+/i);

        if (!quoteMatch || quoteMatch.index === undefined) {
            return { mainContent: html, quotedContent: '' };
        }

        const splitIndex = quoteMatch.index;
        const mainContent = html.substring(0, splitIndex).trim();
        const quotedContent = html.substring(splitIndex).trim();

        return { mainContent, quotedContent };
    };

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

        let cleanContent = stripRTLDirectives(conversation.body || conversation.body_text || '');

        setHeaderText(`Edited by ${user.email}`);

        cleanContent = cleanContent.replace(
            /<div class="non-editable-header">.*?<\/div>/s,
            ''
        ).replace(
            /Created by .*?/s,
            ''
        ).replace(
            /Edited by .*?/s,
            ''
        ).trim();

        setEditContent(cleanContent);
        setEditingAttachments(conversation.attachments || []);
        setNewAttachments([]);
        setEditDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            console.log('Deleting conversation:', deleteTarget);
            await ticketService.deleteConversation(deleteTarget._id);

            showSuccessToast(`${deleteTarget.source === 2 ? 'Note' : 'Reply'} deleted successfully`);
            if (onRefresh) onRefresh();
        } catch (error) {
            handleError(error);
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
            const fullContent = `<div class="non-editable-header"><p>${headerText}</p><hr/></div>${editContent}`;

            const formData = new FormData();
            formData.append('body', fullContent);

            if (newAttachments.length > 0) {
                newAttachments.forEach((file, index) => {
                    formData.append(`attachments[${index}]`, file);
                });
            }

            await ticketService.updateConversation(editTarget._id, formData);

            showSuccessToast("Note updated successfully");

            if (onRefresh) onRefresh();
        } catch (error) {
            handleError(error);
        } finally {
            setIsEditing(false);
            setEditDialogOpen(false);
            setEditTarget(null);
            setEditContent('');
            setHeaderText('');
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
            ? (agentMap[conversation.user_id]
            || contactMap[conversation.user_id]
            || "System")
            : "System";

        const userInitial = (userName || "U").charAt(0).toUpperCase();
        const timeAgo = formatRelativeTime(conversation.created_at);
        const timeWithDate = formatTimeWithParentheses(conversation.created_at);

        let bgColor = 'bg-white';
        let avatarBg = 'bg-cyan-500';
        let borderColor = '';

        if (isPrivateNote) {
            bgColor = 'bg-amber-50';
            avatarBg = 'bg-amber-400';
            borderColor = 'border-l-4 border-amber-300';
        } else if (isPublicNote) {
            bgColor = 'bg-emerald-50';
            avatarBg = 'bg-emerald-400';
            borderColor = 'border-l-4 border-emerald-300';
        } else if (isForward) {
            bgColor = 'bg-blue-50';
            avatarBg = 'bg-blue-400';
            borderColor = 'border-l-4 border-blue-300';
        } else if (isReply) {
            bgColor = 'bg-white';
            avatarBg = 'bg-indigo-500';
            borderColor = 'border-l-4 border-indigo-300';
        }

        const canEdit = isNote && !contactMap[conversation.user_id];
        const canDelete = (isNote || isReply || isForward) && !contactMap[conversation.user_id];

        const hasPendingEmails = conversation.pending_emails?.length > 0;
        const hasFailedEmails = conversation.failed_emails?.length > 0;

        const { mainContent, quotedContent } = splitQuotedContent(conversation.body || conversation.body_text);
        const hasQuotes = !!quotedContent;
        const isExpanded = expandedQuotes[conversation._id];

        const ActionIcon = isReply ? Reply : isForward ? Forward : isPrivateNote ? EyeOff : Eye;
        const actionText = isReply ? 'replied' : isForward ? 'forwarded' : isPrivateNote ? 'added a private note' : 'added a public note';

        return (
            <Card key={conversation.id || index} className={`p-0 mb-4 shadow-sm overflow-hidden ${bgColor} ${borderColor}`}>
                {hasFailedEmails && (
                    <div className="p-3 bg-red-100 border-b border-red-300">
                        <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-red-700 font-medium text-sm">
                                Failed to deliver to: {conversation.failed_emails.join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                {hasPendingEmails && (
                    <div className="p-3 bg-orange-100 border-b border-orange-300">
                        <div className="flex items-start">
                            <Clock className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-orange-700 font-medium text-sm">
                                Pending delivery to: {conversation.pending_emails.join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4">
                    <div className="flex items-start">
                        <Avatar className="h-10 w-10 mr-3 ring-2 ring-white shadow-sm">
                            <AvatarFallback className={`${avatarBg} text-white font-semibold`}>
                                {userInitial}
                            </AvatarFallback>
                            {conversation.user_avatar_url && <AvatarImage src={conversation.user_avatar_url} />}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-blue-700">{userName}</span>
                                    <Badge
                                        variant="outline"
                                        className={`flex items-center text-xs gap-1 py-0 h-5 ${
                                            isPrivateNote ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                            isPublicNote ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                            isForward ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                            'bg-indigo-100 text-indigo-800 border-indigo-300'
                                        }`}
                                    >
                                        <ActionIcon className="h-3 w-3" />
                                        <span>{actionText}</span>
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 hidden sm:inline">
                                        {timeAgo} {timeWithDate}
                                    </span>

                                    {(canEdit || canDelete) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                {canEdit && (
                                                    <DropdownMenuItem onClick={() => handleEditClick(conversation)} className="cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {canDelete && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(conversation)}
                                                        className="text-red-600 cursor-pointer"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 mb-3 sm:hidden">
                                {timeAgo} {timeWithDate}
                            </div>

                            {isReply && conversation.to_emails && conversation.to_emails.length > 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-2 mb-3">
                                    <div className="flex items-center text-gray-700 text-sm">
                                        <Mail className="h-3.5 w-3.5 mr-2 text-gray-500" />
                                        <span className="font-medium">To:</span>
                                        <span className="ml-1 truncate">
                                            {Array.isArray(conversation.to_emails)
                                                ? conversation.to_emails.join(', ')
                                                : JSON.stringify(conversation.to_emails)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {isForward && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                                    <div className="flex items-center mb-1.5">
                                        <Forward className="h-3.5 w-3.5 text-blue-600 mr-2" />
                                        <span className="font-medium text-blue-700">Forwarded To:</span>
                                        <span className="ml-1.5 text-gray-800 text-sm">
                                            {Array.isArray(conversation.to_emails)
                                                ? conversation.to_emails.join(', ')
                                                : conversation.to_emails || conversation.forward_emails || "Unknown recipient"}
                                        </span>
                                    </div>

                                    {conversation.cc_emails && conversation.cc_emails.length > 0 && (
                                        <div className="flex items-center mb-1.5">
                                            <span className="w-3.5 text-center text-gray-500 mr-2">Cc:</span>
                                            <span className="text-gray-800 text-sm">
                                                {Array.isArray(conversation.cc_emails)
                                                    ? conversation.cc_emails.join(', ')
                                                    : JSON.stringify(conversation.cc_emails)}
                                            </span>
                                        </div>
                                    )}

                                    {conversation.bcc_emails && conversation.bcc_emails.length > 0 && (
                                        <div className="flex items-center">
                                            <span className="w-3.5 text-center text-gray-500 mr-2">Bcc:</span>
                                            <span className="text-gray-800 text-sm">
                                                {Array.isArray(conversation.bcc_emails)
                                                    ? conversation.bcc_emails.join(', ')
                                                    : JSON.stringify(conversation.bcc_emails)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="conversation-body prose max-w-none text-gray-800">
                                <div dangerouslySetInnerHTML={{ __html: mainContent }} />

                                {hasQuotes && (
                                    <div className="mt-3 pt-2 border-t border-gray-200">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleQuoteVisibility(conversation._id)}
                                            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 h-7 px-2.5 rounded-full"
                                        >
                                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            <span className="text-xs">{isExpanded ? "Hide quoted text" : "Show quoted text"}</span>
                                        </Button>

                                        {isExpanded && (
                                            <div
                                                className="mt-2 pl-4 border-l-2 border-gray-300 text-gray-600 text-sm"
                                                dangerouslySetInnerHTML={{ __html: quotedContent }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {conversation.attachments && conversation.attachments.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <h3 className="text-xs uppercase tracking-wide font-semibold mb-2 text-gray-600">Attachments</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {conversation.attachments.map((attachment, idx) => {
                                            const downloadFile = (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const downloadLink = document.createElement('a');
                                                downloadLink.href = attachment.attachment_url;
                                                downloadLink.download = attachment.name;
                                                document.body.appendChild(downloadLink);
                                                downloadLink.click();
                                                document.body.removeChild(downloadLink);
                                            };

                                            const openLink = (e) => {
                                                e.preventDefault();
                                                window.open(attachment.attachment_url, '_blank');
                                            };

                                            return (
                                                <div key={idx} className="flex items-center px-3 py-1.5 rounded-md bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                                    <div
                                                        className="cursor-pointer flex items-center gap-1.5 text-gray-700 hover:text-blue-600 group-hover:underline"
                                                        onClick={openLink}
                                                    >
                                                        <PaperclipIcon className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="text-xs font-medium truncate max-w-[150px]">
                                                            {attachment.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={downloadFile}
                                                        className="ml-2 text-blue-600 hover:text-blue-700"
                                                        title="Download file"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <>
            {hasMoreConversations && (
                <div className="flex justify-center mb-4">
                    <Button
                        variant="outline"
                        onClick={toggleShowAllConversations}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                        size="sm"
                    >
                        {showAllConversations ? (
                            <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                <span>Show recent conversations</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                <span>Show all conversations (+{conversations.length - 3})</span>
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
                        <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                            <p className="font-medium text-gray-700">{headerText}</p>
                            <div className="my-2 border-t border-gray-300"></div>
                        </div>

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
