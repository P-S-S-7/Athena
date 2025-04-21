import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Forward, User, Users, UserPlus, X, PaperclipIcon, FileText, Download } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from '@/utils/RichTextEditor';
import { showSuccessToast } from '@/utils/toast';
import ticketService from '@/services/ticketService';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useError } from '@/contexts/ErrorContext';
import { useData } from '@/contexts/DataContext';

const ForwardTicket = ({ ticketId, ticket, onSuccess }) => {
    const { handleError } = useError();
    const [content, setContent] = useState('');
    const [to, setTo] = useState([]);
    const [cc, setCc] = useState([]);
    const [bcc, setBcc] = useState([]);
    const [toInput, setToInput] = useState('');
    const [ccInput, setCcInput] = useState('');
    const [bccInput, setBccInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toCommandOpen, setToCommandOpen] = useState(false);
    const [ccCommandOpen, setCcCommandOpen] = useState(false);
    const [bccCommandOpen, setBccCommandOpen] = useState(false);
    const [includeOriginalAttachments, setIncludeOriginalAttachments] = useState(false);
    const [hasCannedResponse, setHasCannedResponse] = useState(false);
    const { agentMap, contactMap, agentEmailMap, contactEmailMap } = useData();

    const userEmailMap = { ...agentEmailMap, ...contactEmailMap };
    const userMap = { ...agentMap, ...contactMap };

    const emailOptions = Object.entries(userEmailMap || {}).map(([id, email]) => ({
        id,
        email,
        name: userMap[id] || 'Agent'
    })).filter(item => item.email);

    useEffect(() => {
        if (content.trim() && hasCannedResponse === false) {
            setHasCannedResponse(true);
        }
    }, [content, hasCannedResponse]);

    useEffect(() => {
        if (ticket) {
            const contactName = contactMap[ticket.requester_id] || 'Contact';
            const contactEmail = contactEmailMap[ticket.requester_id] || '';
            const defaultContent = `Please take a look at ticket #${ticket.id} raised by ${contactName} (${contactEmail}).`;

            setContent(defaultContent);
        }
    }, [ticket]);

    const handleContentChange = (newContent) => {
        setContent(newContent);

        if (newContent.trim() && !content.trim()) {
            setHasCannedResponse(true);
        }
    };

    const addRecipient = (type, email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email.trim())) return;

        switch (type) {
            case 'to':
                if (!to.includes(email.trim())) {
                    setTo([...to, email.trim()]);
                }
                setToInput('');
                break;
            case 'cc':
                if (!cc.includes(email.trim())) {
                    setCc([...cc, email.trim()]);
                }
                setCcInput('');
                break;
            case 'bcc':
                if (!bcc.includes(email.trim())) {
                    setBcc([...bcc, email.trim()]);
                }
                setBccInput('');
                break;
            default:
                break;
        }
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            let value = '';
            switch (type) {
                case 'to': value = toInput; break;
                case 'cc': value = ccInput; break;
                case 'bcc': value = bccInput; break;
                default: return;
            }

            addRecipient(type, value);
        } else if (e.key === ',' || e.key === ';') {
            e.preventDefault();

            let value = '';
            switch (type) {
                case 'to': value = toInput; break;
                case 'cc': value = ccInput; break;
                case 'bcc': value = bccInput; break;
                default: return;
            }

            addRecipient(type, value);
        }
    };

    const removeRecipient = (type, email) => {
        switch (type) {
            case 'to':
                setTo(to.filter(e => e !== email));
                break;
            case 'cc':
                setCc(cc.filter(e => e !== email));
                break;
            case 'bcc':
                setBcc(bcc.filter(e => e !== email));
                break;
            default:
                break;
        }
    };

    const handleSubmit = async () => {
        if (to.length === 0) {
            handleError(new Error('At least one recipient is required'));
            return;
        }

        if (!content.trim()) {
            handleError(new Error('Message content cannot be empty'));
            return;
        }

        try {
            setIsSubmitting(true);

            const forwardOptions = {
                body: content,
                to_emails: to,
                cc_emails: cc,
                bcc_emails: bcc,
                include_original_attachments: includeOriginalAttachments
            };

            await ticketService.forwardTicket(ticketId, forwardOptions);

            showSuccessToast('Ticket forwarded successfully');
            setContent('');
            setTo([]);
            setCc([]);
            setBcc([]);
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

    const filteredEmailOptions = (input, currentList) => {
        const inputLower = input.toLowerCase();
        return emailOptions.filter(option =>
            (option.email.toLowerCase().includes(inputLower) ||
                option.name.toLowerCase().includes(inputLower)) &&
            !currentList.includes(option.email)
        );
    };

    return (
        <Card className="p-4 mt-6">
            <div className="mb-2 font-medium">Forward Ticket</div>

            <div className="space-y-4 mb-4">
                <div>
                    <Label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                        To: <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md">
                        {to.map((email, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {email}
                                <button
                                    type="button"
                                    onClick={() => removeRecipient('to', email)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <div className="flex-1 min-w-[200px]">
                            <Popover open={toCommandOpen} onOpenChange={setToCommandOpen}>
                                <PopoverTrigger asChild>
                                    <Input
                                        id="to"
                                        value={toInput}
                                        onChange={(e) => setToInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'to')}
                                        placeholder="Enter or select email addresses"
                                        className="border-none shadow-none focus-visible:ring-0 p-0 h-8"
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search agents..." />
                                        <CommandList>
                                            <CommandEmpty>No agents found</CommandEmpty>
                                            <CommandGroup>
                                                {filteredEmailOptions(toInput, to).map((option) => (
                                                    <CommandItem
                                                        key={option.id}
                                                        onSelect={() => {
                                                            addRecipient('to', option.email);
                                                            setToCommandOpen(false);
                                                        }}
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        {option.name} - {option.email}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Enter email addresses or select from agents
                    </p>
                </div>

                <div>
                    <Label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                        Cc:
                    </Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md">
                        {cc.map((email, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {email}
                                <button
                                    type="button"
                                    onClick={() => removeRecipient('cc', email)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <div className="flex-1 min-w-[200px]">
                            <Popover open={ccCommandOpen} onOpenChange={setCcCommandOpen}>
                                <PopoverTrigger asChild>
                                    <Input
                                        id="cc"
                                        value={ccInput}
                                        onChange={(e) => setCcInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'cc')}
                                        placeholder="Enter or select email addresses"
                                        className="border-none shadow-none focus-visible:ring-0 p-0 h-8"
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search agents..." />
                                        <CommandList>
                                            <CommandEmpty>No agents found</CommandEmpty>
                                            <CommandGroup>
                                                {filteredEmailOptions(ccInput, cc).map((option) => (
                                                    <CommandItem
                                                        key={option.id}
                                                        onSelect={() => {
                                                            addRecipient('cc', option.email);
                                                            setCcCommandOpen(false);
                                                        }}
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        {option.name} - {option.email}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div>
                    <Label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
                        Bcc:
                    </Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md">
                        {bcc.map((email, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <UserPlus className="h-3 w-3" />
                                {email}
                                <button
                                    type="button"
                                    onClick={() => removeRecipient('bcc', email)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <div className="flex-1 min-w-[200px]">
                            <Popover open={bccCommandOpen} onOpenChange={setBccCommandOpen}>
                                <PopoverTrigger asChild>
                                    <Input
                                        id="bcc"
                                        value={bccInput}
                                        onChange={(e) => setBccInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'bcc')}
                                        placeholder="Enter or select email addresses"
                                        className="border-none shadow-none focus-visible:ring-0 p-0 h-8"
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search agents..." />
                                        <CommandList>
                                            <CommandEmpty>No agents found</CommandEmpty>
                                            <CommandGroup>
                                                {filteredEmailOptions(bccInput, bcc).map((option) => (
                                                    <CommandItem
                                                        key={option.id}
                                                        onSelect={() => {
                                                            addRecipient('bcc', option.email);
                                                            setBccCommandOpen(false);
                                                        }}
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        {option.name} - {option.email}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div>
                    <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject:
                    </Label>
                    <Input
                        id="subject"
                        value={`Fwd: #${ticketId} ${ticket?.subject || ''}`}
                        disabled
                        className="bg-gray-50"
                    />
                </div>
            </div>

            <div className="mb-4">
                <Label htmlFor="forwardBox" className="block text-sm font-medium text-gray-700 mb-1">
                    Message:
                </Label>
                <RichTextEditor
                    id="forwardBox"
                    value={content}
                    onChange={handleContentChange}
                    className="min-h-[150px] mb-4"
                    onCannedResponseInserted={setHasCannedResponse}
                />
            </div>

            {ticket?.attachments && ticket.attachments.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        <div className="flex items-center flex-grow">
                            <Checkbox
                                id="includeAttachments"
                                checked={includeOriginalAttachments}
                                onCheckedChange={setIncludeOriginalAttachments}
                                className="mr-2"
                            />
                            <Label htmlFor="includeAttachments" className="text-sm font-medium">
                                Include original ticket attachments
                            </Label>
                        </div>
                    </div>

                    {includeOriginalAttachments && (
                        <div className="mt-2 ml-6">
                            <p className="text-sm text-gray-500">The following attachments will be included:</p>
                            <ul className="mt-1 space-y-1">
                                {ticket.attachments.map((attachment, index) => (
                                    <li key={index} className="flex items-center text-sm">
                                        <PaperclipIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{attachment.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || to.length === 0 || !content.trim()}
                    className="flex items-center gap-1"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Forward className="h-4 w-4 mr-2" />
                            Forward
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default ForwardTicket;
