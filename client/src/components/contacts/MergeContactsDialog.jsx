import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, X, AlertTriangle, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import contactService from "@/services/contactService";
import { companyMap } from "@/utils/freshdeskMappings";

const MAX_OTHER_EMAILS = 9;

const MergeContactsDialog = ({ isOpen, onClose, onMerge, selectedContacts, contacts }) => {
    const [activeTab, setActiveTab] = useState("select-primary");
    const [primaryContact, setPrimaryContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [primaryContactData, setPrimaryContactData] = useState(null);
    const [detailedContacts, setDetailedContacts] = useState([]);
    const [fetchingDetails, setFetchingDetails] = useState(true);

    const [mergeData, setMergeData] = useState({
        email: "",
        other_emails: [],
        phone: "",
        mobile: "",
        unique_external_id: "",
        company_ids: []
    });

    useEffect(() => {
        if (isOpen && contacts.length > 0) {
            const firstContactId = contacts[0]?.id || null;
            setPrimaryContact(firstContactId);
            setPrimaryContactData(contacts[0] || null);
            setMergeData({
                email: "",
                other_emails: [],
                phone: "",
                mobile: "",
                unique_external_id: "",
                company_ids: []
            });
            setActiveTab("select-primary");

            const fetchDetailedContacts = async () => {
                setFetchingDetails(true);
                try {
                    const detailedContactsData = await Promise.all(
                        contacts.map(async (contact) => {
                            try {
                                const response = await contactService.getContact(contact.id);
                                return response.contact;
                            } catch (error) {
                                return contact;
                            }
                        })
                    );
                    setDetailedContacts(detailedContactsData);
                } catch (error) {
                } finally {
                    setFetchingDetails(false);
                }
            };

            fetchDetailedContacts();
        } else {
            setPrimaryContact(null);
            setPrimaryContactData(null);
            setDetailedContacts([]);
        }
        setError(null);
    }, [isOpen, contacts]);

    useEffect(() => {
        if (primaryContact && detailedContacts.length > 0) {
            const primaryData = detailedContacts.find(c => c.id === primaryContact);
            if (primaryData) {
                setPrimaryContactData(primaryData);
            }
        }
    }, [primaryContact, detailedContacts]);

    useEffect(() => {
        if (detailedContacts.length > 0) {
            const primaryData = detailedContacts.find(c => c.id === primaryContact) || detailedContacts[0];

            const allPhones = detailedContacts.map(c => c.phone).filter(Boolean);
            const allMobiles = detailedContacts.map(c => c.mobile).filter(Boolean);
            const allExternalIds = detailedContacts.map(c => c.unique_external_id).filter(Boolean);

            let bestPhone = "";
            let bestMobile = "";
            let bestExternalId = "";

            if (allPhones.length === 1) {
                bestPhone = allPhones[0];
            } else if (allPhones.length > 1 && primaryData.phone) {
                bestPhone = primaryData.phone;
            } else if (allPhones.length > 0) {
                bestPhone = allPhones[0];
            }

            if (allMobiles.length === 1) {
                bestMobile = allMobiles[0];
            } else if (allMobiles.length > 1 && primaryData.mobile) {
                bestMobile = primaryData.mobile;
            } else if (allMobiles.length > 0) {
                bestMobile = allMobiles[0];
            }

            if (allExternalIds.length === 1) {
                bestExternalId = allExternalIds[0];
            } else if (allExternalIds.length > 1 && primaryData.unique_external_id) {
                bestExternalId = primaryData.unique_external_id;
            } else if (allExternalIds.length > 0) {
                bestExternalId = allExternalIds[0];
            }

            let primaryEmail = "";
            let secondaryEmails = [];

            if (primaryData.email) {
                primaryEmail = primaryData.email;

                detailedContacts.forEach(contact => {
                    if (contact.other_emails && Array.isArray(contact.other_emails)) {
                        secondaryEmails.push(...contact.other_emails);
                    }

                    if (contact.id !== primaryContact && contact.email) {
                        secondaryEmails.push(contact.email);
                    }
                });
            } else {
                const secondaryWithEmails = detailedContacts.filter(
                    c => c.id !== primaryContact && c.email
                );

                if (secondaryWithEmails.length > 0) {
                    primaryEmail = secondaryWithEmails[0].email;

                    detailedContacts.forEach(contact => {
                        if (contact.other_emails && Array.isArray(contact.other_emails)) {
                            secondaryEmails.push(...contact.other_emails);
                        }

                        if (contact.id !== primaryContact && contact.email && contact.email !== primaryEmail) {
                            secondaryEmails.push(contact.email);
                        }
                    });
                } else {
                    primaryEmail = "";

                    detailedContacts.forEach(contact => {
                        if (contact.other_emails && Array.isArray(contact.other_emails)) {
                            secondaryEmails.push(...contact.other_emails);
                        }
                    });
                }
            }

            const uniqueEmails = [...new Set(secondaryEmails)]
                .filter(email => email !== primaryEmail)
                .slice(0, MAX_OTHER_EMAILS);

            const allCompanyIds = new Set();
            detailedContacts.forEach(contact => {
                if (contact.company_id) {
                    allCompanyIds.add(contact.company_id);
                }
            });

            setMergeData({
                email: primaryEmail,
                other_emails: uniqueEmails,
                phone: bestPhone,
                mobile: bestMobile,
                unique_external_id: bestExternalId,
                company_ids: [...allCompanyIds]
            });
        }
    }, [primaryContact, detailedContacts]);

    const handleProceedToReview = () => {
        if (!primaryContact) {
            setError("Please select a primary contact");
            return;
        }
        setActiveTab("review-fields");
    };

    const handleSubmit = async () => {
        if (!primaryContact) {
            setError("Please select a primary contact");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const secondaryContactIds = selectedContacts.filter(id => id !== primaryContact);

            const mergePayload = {
                primary_contact_id: primaryContact,
                secondary_contact_ids: secondaryContactIds,
                contact: {}
            };

            if (mergeData.email) {
                mergePayload.contact.email = mergeData.email;
            }

            if (mergeData.other_emails && mergeData.other_emails.length > 0) {
                mergePayload.contact.other_emails = mergeData.other_emails;
            }

            if (mergeData.phone) {
                mergePayload.contact.phone = mergeData.phone;
            }

            if (mergeData.mobile) {
                mergePayload.contact.mobile = mergeData.mobile;
            }

            if (mergeData.unique_external_id) {
                mergePayload.contact.unique_external_id = mergeData.unique_external_id;
            }

            if (mergeData.company_ids && mergeData.company_ids.length > 0) {
                mergePayload.contact.company_ids = mergeData.company_ids;
            }

            onClose();

            await onMerge(primaryContact, secondaryContactIds, mergePayload.contact);
        } catch (error) {
            setError(error.message || "Failed to merge contacts. Please try again.");
            setLoading(false);
        }
    };

    const handleEmailRemove = (emailToRemove) => {
        setMergeData(prev => ({
            ...prev,
            other_emails: prev.other_emails.filter(email => email !== emailToRemove)
        }));
    };

    const handleCompanyRemove = (companyIdToRemove) => {
        setMergeData(prev => ({
            ...prev,
            company_ids: prev.company_ids.filter(id => id !== companyIdToRemove)
        }));
    };

    const getUniqueValuesForField = (fieldName) => {
        return detailedContacts
            .map(contact => contact[fieldName])
            .filter(Boolean)
            .filter((value, index, self) => self.indexOf(value) === index);
    };

    if (fetchingDetails && activeTab === "select-primary") {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Merge Contacts</DialogTitle>
                        <DialogDescription>
                            Loading contact details...
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3 text-lg">Loading contacts...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-md md:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Merge Contacts</DialogTitle>
                    <DialogDescription>
                        Merging will combine information from multiple contacts into one.
                        The secondary contacts will be deleted after merging.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="select-primary">1. Select Primary</TabsTrigger>
                        <TabsTrigger value="review-fields" disabled={!primaryContact}>2. Review Fields</TabsTrigger>
                    </TabsList>

                    <TabsContent value="select-primary" className="py-4">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500">
                                Select the primary contact. Name from this contact will be kept.
                                All other contacts will be merged into this one and then deleted.
                            </p>
                        </div>

                        <RadioGroup value={primaryContact} onValueChange={setPrimaryContact}>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-3">
                                    {detailedContacts.map((contact) => (
                                        <div key={contact.id} className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50">
                                            <RadioGroupItem value={contact.id} id={`contact-${contact.id}`} className="mt-1" />
                                            <Label htmlFor={`contact-${contact.id}`} className="flex items-start cursor-pointer flex-1">
                                                <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                                                    {contact.avatar && contact.avatar.avatar_url ? (
                                                        <AvatarImage src={contact.avatar.avatar_url} alt={contact.name} />
                                                    ) : null}
                                                    <AvatarFallback>
                                                        {contact.name ? contact.name.charAt(0).toUpperCase() : "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium">{contact.name}</p>
                                                    <div className="text-sm text-gray-500">
                                                        {contact.email && (
                                                            <p className="break-all mb-1 flex items-center">
                                                                <Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                                                {contact.email}
                                                            </p>
                                                        )}
                                                        {contact.other_emails && contact.other_emails.length > 0 && (
                                                            <div className="mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    + {contact.other_emails.length} other email{contact.other_emails.length > 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {contact.phone && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Phone: {contact.phone}
                                                            </Badge>
                                                        )}
                                                        {contact.job_title && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {contact.job_title}
                                                            </Badge>
                                                        )}
                                                        {contact.company_name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {contact.company_name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </RadioGroup>

                        <div className="mt-6">
                            <Button onClick={handleProceedToReview} disabled={!primaryContact}>
                                Next: Review Fields
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="review-fields" className="py-4">
                        <div className="mb-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-amber-800 flex items-start">
                                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Important:</strong> Please review the information you'd like to associate with the primary contact.
                                        You can have a maximum of 9 secondary emails. Secondary contacts will be deleted after merging.
                                    </span>
                                </p>
                            </div>

                            {primaryContactData && (
                                <div className="bg-gray-50 p-4 rounded-md mb-4">
                                    <div className="flex items-center mb-2">
                                        <Avatar className="h-10 w-10 mr-3">
                                            {primaryContactData.avatar && primaryContactData.avatar.avatar_url ? (
                                                <AvatarImage src={primaryContactData.avatar.avatar_url} alt={primaryContactData.name} />
                                            ) : null}
                                            <AvatarFallback>
                                                {primaryContactData.name ? primaryContactData.name.charAt(0).toUpperCase() : "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-lg">{primaryContactData.name}</p>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Mail className="h-3.5 w-3.5 mr-1" />
                                                {mergeData.email || "No email"}
                                                {!primaryContactData.email && mergeData.email && (
                                                    <span className="ml-2 text-xs text-amber-600">
                                                        (Selected from secondary contact)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        The name from this contact will be used for the merged contact.
                                        {!primaryContactData.email && mergeData.email &&
                                            " Email was selected from a secondary contact since primary contact has no email."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div>
                                <Label className="flex items-center text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                    Other Emails ({mergeData.other_emails.length}/{MAX_OTHER_EMAILS})
                                </Label>
                                <div className="border rounded-md p-3 mt-1 min-h-[80px]">
                                    <div className="flex flex-wrap gap-2">
                                        {mergeData.other_emails.map((email, idx) => (
                                            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => handleEmailRemove(email)}
                                                    className="focus:outline-none"
                                                >
                                                    <X className="h-3 w-3 cursor-pointer" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {mergeData.other_emails.length === 0 && (
                                            <p className="text-sm text-gray-500">No additional emails</p>
                                        )}
                                    </div>
                                </div>
                                {mergeData.other_emails.length >= MAX_OTHER_EMAILS && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Maximum of {MAX_OTHER_EMAILS} secondary emails reached. Please remove some to add more.
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label className="flex items-center text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                    Companies
                                </Label>
                                <div className="border rounded-md p-3 mt-1 min-h-[80px]">
                                    <div className="flex flex-wrap gap-2">
                                        {mergeData.company_ids.map((companyId) => (
                                            <Badge key={companyId} variant="secondary" className="flex items-center gap-1">
                                                {companyMap[companyId] || `Company ${companyId}`}
                                                <button
                                                    type="button"
                                                    onClick={() => handleCompanyRemove(companyId)}
                                                    className="focus:outline-none"
                                                >
                                                    <X className="h-3 w-3 cursor-pointer" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {mergeData.company_ids.length === 0 && (
                                            <p className="text-sm text-gray-500">No companies</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="phone" className="flex items-center text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                    Work Phone
                                </Label>
                                <Select
                                    value={mergeData.phone}
                                    onValueChange={(value) => setMergeData(prev => ({ ...prev, phone: value }))}
                                >
                                    <SelectTrigger id="phone" className="mt-1">
                                        <SelectValue placeholder="Select work phone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getUniqueValuesForField('phone').map((phone, idx) => (
                                            <SelectItem key={idx} value={phone}>{phone}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="mobile" className="flex items-center text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                    Mobile Phone
                                </Label>
                                <Select
                                    value={mergeData.mobile}
                                    onValueChange={(value) => setMergeData(prev => ({ ...prev, mobile: value }))}
                                >
                                    <SelectTrigger id="mobile" className="mt-1">
                                        <SelectValue placeholder="Select mobile phone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getUniqueValuesForField('mobile').map((mobile, idx) => (
                                            <SelectItem key={idx} value={mobile}>{mobile}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="unique_external_id" className="flex items-center text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                    Unique External ID
                                </Label>
                                <Select
                                    value={mergeData.unique_external_id}
                                    onValueChange={(value) => setMergeData(prev => ({ ...prev, unique_external_id: value }))}
                                >
                                    <SelectTrigger id="unique_external_id" className="mt-1">
                                        <SelectValue placeholder="Select external ID" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getUniqueValuesForField('unique_external_id').map((id, idx) => (
                                            <SelectItem key={idx} value={id}>{id}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>

                    {activeTab === "select-primary" ? (
                        <Button
                            onClick={handleProceedToReview}
                            disabled={!primaryContact || loading}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!primaryContact || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Merging...
                                </>
                            ) : (
                                "Confirm Merge"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MergeContactsDialog;
