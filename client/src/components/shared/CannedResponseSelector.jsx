import { useState, useEffect, forwardRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, FolderClosed, ChevronRight, MessageSquare, X, PaperclipIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useError } from '@/contexts/ErrorContext';
import cannedResponseService from '@/services/cannedResponseService';

const CannedResponseSelector = forwardRef(({ onSelectResponse }, ref) => {
    const { handleError } = useError();
    const [open, setOpen] = useState(false);
    const [folders, setFolders] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [folderResponses, setFolderResponses] = useState({});
    const [allResponses, setAllResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentlyUsed, setRecentlyUsed] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchFoldersAndAllResponses = async () => {
            try {
                setLoading(true);
                const folderData = await cannedResponseService.getFolders();
                setFolders(folderData || []);

                const expandedState = {};
                folderData.forEach(folder => {
                    expandedState[folder._id] = false;
                });
                setExpandedFolders(expandedState);

                const responsesArray = await Promise.all(
                    folderData.map(async (folder) => {
                        const res = await cannedResponseService.getFolderResponses(folder._id);
                        return { folderId: folder._id, responses: res.canned_responses || [] };
                    })
                );

                const folderResponsesMap = {};
                responsesArray.forEach(({ folderId, responses }) => {
                    folderResponsesMap[folderId] = responses;
                });
                setFolderResponses(folderResponsesMap);

                const flatResponses = [];
                responsesArray.forEach(({ folderId, responses }) => {
                    const folder = folderData.find(f => f._id === folderId);
                    responses.forEach(response => {
                        flatResponses.push({
                            ...response,
                            folderName: folder ? folder.name : 'Unknown Folder'
                        });
                    });
                });
                setAllResponses(flatResponses);

                const storedRecent = localStorage.getItem('recentCannedResponses');
                if (storedRecent) {
                    try {
                        setRecentlyUsed(JSON.parse(storedRecent));
                    } catch (e) {
                        console.error("Error parsing stored recent responses:", e);
                        localStorage.removeItem('recentCannedResponses');
                    }
                }

            } catch (error) {
                handleError(error);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchFoldersAndAllResponses();
        } else {
            setSearchQuery('');
        }
    }, [open, handleError]);

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    const handleSelectResponse = async (responseId) => {
        try {
            setLoading(true);
            const response = await cannedResponseService.getResponse(responseId);

            const updatedRecent = [
                {
                    id: response.id,
                    title: response.title,
                    folder_id: response.folder_id,
                    has_attachments: response.attachments && response.attachments.length > 0,
                    _uniqueId: Date.now().toString()
                },
                ...recentlyUsed.filter(item => item.id !== response.id).slice(0, 4)
            ];
            setRecentlyUsed(updatedRecent);
            localStorage.setItem('recentCannedResponses', JSON.stringify(updatedRecent));

            onSelectResponse(response);
            setOpen(false);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResponses = useMemo(() => {
        if (!searchQuery.trim()) return [];

        return allResponses.filter(response =>
            response.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((response, index) => ({
            ...response,
            _searchResultId: `search-${response.id || response._id}-${index}`
        }));
    }, [searchQuery, allResponses]);

    const renderResponseItem = (response, onClick) => {
        const hasAttachments = response.has_attachments;

        return (
            <div
            className="py-2 px-3 hover:bg-gray-100 rounded-md cursor-pointer text-sm transition-colors"
            onClick={onClick}
            >
            <div className="flex items-center justify-between">
            <span>
                {response.title.length > 50
                ? response.title.substring(0, 50).split(' ').slice(0, -1).join(' ') + '...'
                : response.title}
            </span>
            {hasAttachments && (
            <Badge variant="outline" className="ml-2 px-1.5 py-0.5">
                <PaperclipIcon className="h-3 w-3 mr-1" />
                <span className="text-xs">Attachment</span>
            </Badge>
            )}
            </div>
            {response.folderName && (
            <div className="text-xs text-gray-500">{response.folderName}</div>
            )}
            </div>
        );
    };

    const getUniqueKey = (response) => {
        if (response._searchResultId) return response._searchResultId;
        if (response._uniqueId) return response._uniqueId;

        if (response._id) {
            return `resp-${response._id.toString()}`;
        }

        if (response.id) {
            const folderId = response.folder_id ? `-${response.folder_id}` : '';
            return `id-${response.id}${folderId}`;
        }

        return `key-${Math.random().toString(36).substring(2, 11)}`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    ref={ref}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    data-canned-response-trigger="true"
                >
                    <MessageSquare className="h-4 w-4" />
                    Canned Responses
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Canned Responses</DialogTitle>
                    <DialogDescription>
                        Select a pre-written response to insert into your message.
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search canned responses"
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => setSearchQuery('')}
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all">All Folders</TabsTrigger>
                        <TabsTrigger value="recent">Recently Used</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="max-h-[60vh]">
                        <ScrollArea className="h-[50vh]">
                            {loading && folders.length === 0 ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : searchQuery ? (
                                <>
                                    <h3 className="font-medium text-sm mb-2 text-gray-500">Search Results</h3>
                                    {filteredResponses.length > 0 ? (
                                        filteredResponses.map((response) => (
                                            <div key={getUniqueKey(response)}>
                                                {renderResponseItem(
                                                    response,
                                                    () => handleSelectResponse(response.id || response._id)
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">No responses match your search</div>
                                    )}
                                </>
                            ) : (
                                folders.map((folder) => (
                                    <Collapsible
                                        key={`folder-${folder._id.toString()}`}
                                        open={expandedFolders[folder._id]}
                                        onOpenChange={() => toggleFolder(folder._id)}
                                        className="mb-1"
                                    >
                                        <CollapsibleTrigger className="flex items-center w-full py-2 px-3 hover:bg-gray-100 rounded-md text-sm">
                                            <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${expandedFolders[folder._id] ? 'transform rotate-90' : ''}`} />
                                            <FolderClosed className="h-4 w-4 mr-2 text-amber-500" />
                                            <span className="font-medium">{folder.name}</span>
                                            <span className="ml-auto text-xs text-gray-500">{folder.responses_count}</span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="pl-9 space-y-1">
                                                {expandedFolders[folder._id] && folderResponses[folder._id] && folderResponses[folder._id].length > 0 ? (
                                                    folderResponses[folder._id].map((response, index) => (
                                                        <div key={getUniqueKey(response) || `folder-${folder._id}-resp-${index}`}>
                                                            {renderResponseItem(
                                                                response,
                                                                () => handleSelectResponse(response.id)
                                                            )}
                                                        </div>
                                                    ))
                                                ) : expandedFolders[folder._id] ? (
                                                    <div className="py-2 px-3 text-gray-500 text-sm">
                                                        No responses in this folder
                                                    </div>
                                                ) : null}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))
                            )}
                            {folders.length === 0 && !loading && (
                                <div className="text-center py-4 text-gray-500">No canned response folders found</div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="recent" className="max-h-[60vh]">
                        <ScrollArea className="h-[50vh]">
                            <h3 className="font-medium text-sm mb-2 text-gray-500">Recently Used</h3>
                            {recentlyUsed.length > 0 ? (
                                recentlyUsed.map((response, index) => (
                                    <div key={getUniqueKey(response) || `recent-${index}`}>
                                        {renderResponseItem(
                                            response,
                                            () => handleSelectResponse(response.id)
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">No recently used responses</div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
});

CannedResponseSelector.displayName = "CannedResponseSelector";

export default CannedResponseSelector;
