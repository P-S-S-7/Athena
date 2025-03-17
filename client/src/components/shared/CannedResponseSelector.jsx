import { useState, useEffect, forwardRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentlyUsed, setRecentlyUsed] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                setLoading(true);
                const data = await cannedResponseService.getFolders();
                setFolders(data || []);

                const expandedState = {};
                data.forEach(folder => {
                    expandedState[folder.id] = false;
                });
                setExpandedFolders(expandedState);

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
            fetchFolders();
        }
    }, [open, handleError]);

    const toggleFolder = async (folderId) => {
        const newExpandedState = {
            ...expandedFolders,
            [folderId]: !expandedFolders[folderId]
        };
        setExpandedFolders(newExpandedState);

        if (newExpandedState[folderId] && !folderResponses[folderId]) {
            try {
                setLoading(true);
                const data = await cannedResponseService.getFolderResponses(folderId);
                setFolderResponses(prev => ({
                    ...prev,
                    [folderId]: data.canned_responses || []
                }));
            } catch (error) {
                handleError(error);
            } finally {
                setLoading(false);
            }
        }
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
                    has_attachments: response.attachments && response.attachments.length > 0
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

    const getFilteredResponses = () => {
        if (!searchQuery.trim()) return [];

        const results = [];

        Object.entries(folderResponses).forEach(([folderId, responses]) => {
            const matchingResponses = responses.filter(response =>
                response.title.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (matchingResponses.length > 0) {
                const folder = folders.find(f => f.id.toString() === folderId);
                matchingResponses.forEach(response => {
                    results.push({
                        ...response,
                        folderName: folder ? folder.name : 'Unknown Folder'
                    });
                });
            }
        });

        return results;
    };

    const renderResponseItem = (response, onClick) => {
        const hasAttachments = response.has_attachments;

        return (
            <div
                className="py-2 px-3 hover:bg-gray-100 rounded-md cursor-pointer text-sm transition-colors"
                onClick={onClick}
            >
                <div className="flex items-center justify-between">
                    <span>{response.title}</span>
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
                            {searchQuery ? (
                                <>
                                    <h3 className="font-medium text-sm mb-2 text-gray-500">Search Results</h3>
                                    {getFilteredResponses().map((response) => (
                                        <div key={response.id}>
                                            {renderResponseItem(
                                                response,
                                                () => handleSelectResponse(response.id)
                                            )}
                                        </div>
                                    ))}
                                    {getFilteredResponses().length === 0 && (
                                        <div className="text-center py-4 text-gray-500">No responses match your search</div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {loading && folders.length === 0 ? (
                                        <div className="flex justify-center items-center h-40">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        folders.map((folder) => (
                                            <Collapsible
                                                key={folder.id}
                                                open={expandedFolders[folder.id]}
                                                onOpenChange={() => toggleFolder(folder.id)}
                                                className="mb-1"
                                            >
                                                <CollapsibleTrigger className="flex items-center w-full py-2 px-3 hover:bg-gray-100 rounded-md text-sm">
                                                    <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${expandedFolders[folder.id] ? 'transform rotate-90' : ''}`} />
                                                    <FolderClosed className="h-4 w-4 mr-2 text-amber-500" />
                                                    <span className="font-medium">{folder.name}</span>
                                                    <span className="ml-auto text-xs text-gray-500">{folder.responses_count}</span>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="pl-9 space-y-1">
                                                        {expandedFolders[folder.id] && folderResponses[folder.id] ? (
                                                            folderResponses[folder.id].map((response) => (
                                                                <div key={response.id}>
                                                                    {renderResponseItem(
                                                                        response,
                                                                        () => handleSelectResponse(response.id)
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            expandedFolders[folder.id] && (
                                                                <div className="py-2 px-3 text-gray-500 text-sm">
                                                                    {loading ? 'Loading responses...' : 'No responses in this folder'}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))
                                    )}
                                    {folders.length === 0 && !loading && (
                                        <div className="text-center py-4 text-gray-500">No canned response folders found</div>
                                    )}
                                </>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="recent" className="max-h-[60vh]">
                        <ScrollArea className="h-[50vh]">
                            <h3 className="font-medium text-sm mb-2 text-gray-500">Recently Used</h3>
                            {recentlyUsed.length > 0 ? (
                                recentlyUsed.map((response) => (
                                    <div key={response.id}>
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
