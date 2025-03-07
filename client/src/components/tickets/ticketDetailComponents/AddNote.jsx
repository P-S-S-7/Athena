import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaperclipIcon, Loader2, FileText } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RichTextEditor from '@/utils/RichTextEditor';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import ticketService from '@/services/ticketService';

const AddNote = ({ ticketId, onSuccess }) => {
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [noteType, setNoteType] = useState('private');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            showErrorToast('Note content cannot be empty');
            return;
        }

        try {
            setIsSubmitting(true);

            await ticketService.addNote(
                ticketId,
                {
                    body: content,
                    private: noteType === 'private'
                },
                attachments
            );

            showSuccessToast('Note added successfully');
            setContent('');
            setAttachments([]);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error adding note:', error);
            showErrorToast('Failed to add note');
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

            <RichTextEditor
                id="noteBox"
                value={content}
                onChange={setContent}
                className="min-h-[150px] mb-4"
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

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim()}
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
