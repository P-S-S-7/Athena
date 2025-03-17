import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaperclipIcon, Loader2, FileText, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RichTextEditor from '@/utils/RichTextEditor';
import { showSuccessToast } from '@/utils/toast';
import ticketService from '@/services/ticketService';
import { useError } from '@/contexts/ErrorContext';

const AddNote = ({ ticketId, user, onSuccess }) => {
    const { handleError } = useError();
    const [editableContent, setEditableContent] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [cannedResponseAttachments, setCannedResponseAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [noteType, setNoteType] = useState('private');
    const [hasCannedResponse, setHasCannedResponse] = useState(false);

    const headerText = `Created by ${user.email}`;

    useEffect(() => {
        if (editableContent.trim() && hasCannedResponse === false) {
            setHasCannedResponse(true);
        }
    }, [editableContent, hasCannedResponse]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const removeCannedResponseAttachment = (index) => {
        setCannedResponseAttachments(cannedResponseAttachments.filter((_, i) => i !== index));
    };

    const handleContentChange = (newContent) => {
        setEditableContent(newContent);

        if (newContent.trim() && !editableContent.trim()) {
            setHasCannedResponse(true);
        }
    };

    const handleSubmit = async () => {
        if (!editableContent.trim()) {
            handleError(new Error('Note content cannot be empty'));
            return;
        }

        try {
            setIsSubmitting(true);

            const fullContent = `<div class="non-editable-header"><p>${headerText}</p><hr/><br/></div>${editableContent}`;

            const downloadedAttachments = await Promise.all(
                cannedResponseAttachments.map(async (attachment) => {
                    try {
                        const response = await fetch(attachment.attachment_url);
                        const blob = await response.blob();
                        return new File([blob], attachment.name, { type: attachment.content_type });
                    } catch (error) {
                        console.error(`Failed to download attachment ${attachment.name}:`, error);
                        return null;
                    }
                })
            );

            const validDownloadedAttachments = downloadedAttachments.filter(file => file !== null);

            const allAttachments = [...attachments, ...validDownloadedAttachments];

            await ticketService.addNote(
                ticketId,
                {
                    body: fullContent,
                    private: noteType === 'private'
                },
                allAttachments
            );

            showSuccessToast('Note added successfully');
            setEditableContent('');
            setAttachments([]);
            setCannedResponseAttachments([]);
            setHasCannedResponse(false);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="p-4 mt-6">
            <div className="mb-2 font-medium">Add Note</div>

            <div className="mb-4">
                <RadioGroup
                    value={noteType}
                    onValueChange={setNoteType}
                    className="flex space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private Note (only visible to agents)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">Public Note (visible to contact)</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                <p className="font-medium text-gray-700">{headerText}</p>
                <div className="my-2 border-t border-gray-300"></div>
            </div>

            <RichTextEditor
                id="noteBox"
                value={editableContent}
                onChange={handleContentChange}
                className="min-h-[150px] mb-4"
                onCannedResponseAttachmentsChange={setCannedResponseAttachments}
                onCannedResponseInserted={setHasCannedResponse}
            />

            <div className="mb-4">
                <div className="flex items-center mb-2">
                    <PaperclipIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Attachments</span>
                </div>

                <Input
                    type="file"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    multiple
                    onChange={handleFileChange}
                />

                {attachments.length > 0 && (
                    <div className="mt-2">
                        <h4 className="text-sm font-medium">Your Attachments:</h4>
                        <ul className="mt-1 space-y-1">
                            {attachments.map((file, index) => (
                                <li key={`manual-${index}`} className="flex items-center justify-between text-sm">
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

                {cannedResponseAttachments.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium">Canned Response Attachments:</h4>
                        <ul className="mt-1 space-y-1">
                            {cannedResponseAttachments.map((attachment, index) => (
                                <li
                                    key={`canned-${index}`}
                                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50"
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <FileText className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                                        <span className="truncate">{attachment.name}</span>
                                        <span className="ml-1 text-gray-500">
                                            ({(attachment.size / 1024).toFixed(2)} KB)
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            as="a"
                                            href={attachment.attachment_url}
                                            target="_blank"
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-500"
                                        >
                                            <Download className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeCannedResponseAttachment(index)}
                                            className="text-red-500"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !editableContent.trim()}
                    className="flex items-center gap-1"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4 mr-2" />
                            Add Note
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default AddNote;
