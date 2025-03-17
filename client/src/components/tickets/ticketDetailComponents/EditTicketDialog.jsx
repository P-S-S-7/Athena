import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, Loader2 } from "lucide-react";
import { useError } from '@/contexts/ErrorContext';
import ticketService from '@/services/ticketService';
import RichTextEditor from "@/utils/RichTextEditor";

const EditTicketDialog = ({ ticket, onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editData, setEditData] = useState({
        subject: "",
        description: ""
    });
    const { handleError } = useError();

    useEffect(() => {
        if (ticket) {
            setEditData({
                subject: ticket.subject || "",
                description: ticket.description_html || ticket.description || ""
            });
        }
    }, [ticket, open]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDescriptionChange = (newContent) => {
        setEditData((prev) => ({
            ...prev,
            description: newContent
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editData.subject.trim()) {
            alert("Subject cannot be empty");
            return;
        }

        try {
            setIsSubmitting(true);

            const updateData = {
                subject: editData.subject,
                description: editData.description
            };

            await ticketService.updateTicket(ticket.id, updateData);

            setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Edit className="h-4 w-4" /> Edit Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Edit Ticket #{ticket?.id}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subject" className="font-medium">
                                Subject
                            </Label>
                            <Input
                                id="subject"
                                name="subject"
                                value={editData.subject}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-medium">
                                Description
                            </Label>
                            <RichTextEditor
                                id="description-editor"
                                value={editData.description}
                                onChange={handleDescriptionChange}
                                className="min-h-[300px] border rounded-md"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditTicketDialog;
