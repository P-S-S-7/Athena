import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, X, Upload, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import contactService from "@/services/contactService";
import { showSuccessToast, ToastContainer } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "../../utils/Sidebar";
import Header from "../../utils/Header";
import { ErrorProvider, useError } from "../../contexts/ErrorContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { companyMap } from "@/utils/freshdeskMappings";

const ContactCreateContent = () => {
    const { contactId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();
    const isEditMode = Boolean(contactId);

    const [contactData, setContactData] = useState({
        name: "",
        email: "",
        phone: "",
        mobile: "",
        company_id: "none",
        job_title: "",
        address: "",
        description: "",
        tags: [],
        other_emails: [],
        unique_external_id: "",
        custom_fields: {}
    });

    const [otherEmailInput, setOtherEmailInput] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(isEditMode);
    const [fieldState, setFieldState] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFormLoading(true);

                if (isEditMode) {
                    const { contact } = await contactService.getContact(contactId);

                    setContactData({
                        name: contact.name || "",
                        email: contact.email || "",
                        phone: contact.phone || "",
                        mobile: contact.mobile || "",
                        facebook_id: contact.facebook_id || "",
                        company_id: contact.company_id ? contact.company_id.toString() : "none",
                        job_title: contact.job_title || "",
                        address: contact.address || "",
                        description: contact.description || "",
                        tags: contact.tags || [],
                        other_emails: contact.other_emails || [],
                        unique_external_id: contact.unique_external_id || "",
                        custom_fields: contact.custom_fields || {}
                    });

                    if (contact.avatar && contact.avatar.avatar_url) {
                        setAvatarPreview(contact.avatar.avatar_url);
                    }
                }
            } catch (error) {
                handleError(error);
            } finally {
                setFormLoading(false);
            }
        };

        fetchData();
    }, [contactId, isEditMode, handleError]);

    const handleChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setContactData({
                ...contactData,
                [parent]: {
                    ...contactData[parent],
                    [child]: value
                }
            });
        } else {
            if (field === 'company_id' && value === 'none') {
                setContactData({
                    ...contactData,
                    [field]: ''
                });
            } else {
                setContactData({
                    ...contactData,
                    [field]: value
                });
            }
        }

        setFieldState({
            ...fieldState,
            [field]: true
        });

        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: null
            });
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone) => {
        return /^\d{6,}$/.test(phone);
    };

    const handleAddOtherEmail = (e) => {
        if (e.key === 'Enter' && otherEmailInput.trim()) {
            e.preventDefault();

            if (!validateEmail(otherEmailInput.trim())) {
                setErrors({
                    ...errors,
                    otherEmailInput: "Invalid email format"
                });
                return;
            }

            if (!contactData.other_emails.includes(otherEmailInput.trim())) {
                setContactData({
                    ...contactData,
                    other_emails: [...contactData.other_emails, otherEmailInput.trim()]
                });
                setErrors({
                    ...errors,
                    otherEmailInput: null
                });
            }
            setOtherEmailInput("");
        }
    };

    const handleRemoveOtherEmail = (emailToRemove) => {
        setContactData({
            ...contactData,
            other_emails: contactData.other_emails.filter(email => email !== emailToRemove)
        });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!contactData.tags.includes(tagInput.trim())) {
                setContactData({
                    ...contactData,
                    tags: [...contactData.tags, tagInput.trim()]
                });
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setContactData({
            ...contactData,
            tags: contactData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const removeAvatar = () => {
        setAvatar(null);
        setAvatarPreview("");
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!contactData.name) {
            newErrors.name = "Name is required";
            isValid = false;
        }

        if (contactData.email && !validateEmail(contactData.email)) {
            newErrors.email = "Email format is invalid";
            isValid = false;
        }

        if (contactData.phone && !validatePhone(contactData.phone)) {
            newErrors.phone = "Phone must contain at least 6 digits";
            isValid = false;
        }

        if (contactData.mobile && !validatePhone(contactData.mobile)) {
            newErrors.mobile = "Mobile must contain at least 6 digits";
            isValid = false;
        }

        const hasValidContact = (
            (contactData.email && validateEmail(contactData.email)) ||
            (contactData.phone && validatePhone(contactData.phone)) ||
            (contactData.mobile && validatePhone(contactData.mobile)) ||
            contactData.unique_external_id
        );

        if (!hasValidContact) {
            newErrors.contactMethod = "At least one valid contact method is required (Email, Phone, Mobile, or Unique ID)";
            isValid = false;
        }

        setErrors(newErrors);
        setFieldState({
            ...fieldState,
            name: true,
            email: !!contactData.email,
            phone: !!contactData.phone,
            mobile: !!contactData.mobile,
            unique_external_id: !!contactData.unique_external_id
        });

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const payload = { ...contactData };

            if (payload.company_id && payload.company_id !== 'none') {
                payload.company_id = parseInt(payload.company_id, 10);
            } else {
                delete payload.company_id;
            }

            if (isEditMode) {
                await contactService.updateContact(contactId, payload, avatar);
                showSuccessToast("Contact updated successfully", { autoClose: 3000 });
            } else {
                await contactService.createContact(payload, avatar);
                showSuccessToast("Contact created successfully", { autoClose: 3000 });
            }

            setTimeout(() => {
                navigate("/contacts?refresh=true");
            }, 3000);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                    <Header title={isEditMode ? "Edit Contact" : "Create Contact"} />
                    <main className="flex-grow p-6 overflow-auto">
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="ml-2 text-lg font-medium">Loading...</div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-grow">
                <Header
                    title={isEditMode ? "Edit Contact" : "Create Contact"}
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />
                <main className="flex-grow p-6 overflow-auto">
                    <ToastContainer />

                    <Card className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Tabs defaultValue="basic">
                                <TabsList className="mb-6">
                                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                                    <TabsTrigger value="additional">Additional Details</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-2/3 space-y-4">
                                            <div>
                                                <Label htmlFor="name" className="required mb-2">Full Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={contactData.name || ""}
                                                    onChange={(e) => handleChange("name", e.target.value)}
                                                    required
                                                    placeholder="Enter contact's full name"
                                                    className={errors.name ? "border-red-500" : ""}
                                                />
                                                {errors.name && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                                )}
                                            </div>

                                            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                                                <div className="flex items-start">
                                                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                                                    <div className="text-amber-800 text-sm">
                                                        <p>At least one of the following is required:</p>
                                                        <ul className="list-disc ml-5 mt-1">
                                                            <li>Email (valid format)</li>
                                                            <li>Phone (minimum 6 digits)</li>
                                                            <li>Mobile (minimum 6 digits)</li>
                                                            <li>Unique ID</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {errors.contactMethod && (
                                                <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-2">
                                                    <p className="text-red-600 text-sm">{errors.contactMethod}</p>
                                                </div>
                                            )}

                                            <div>
                                                <Label htmlFor="email" className="mb-2">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={contactData.email}
                                                    onChange={(e) => handleChange("email", e.target.value)}
                                                    placeholder="Enter contact's email address"
                                                    className={errors.email ? "border-red-500" : ""}
                                                />
                                                {errors.email && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="phone" className="mb-2">Phone</Label>
                                                    <Input
                                                        id="phone"
                                                        value={contactData.phone}
                                                        onChange={(e) => handleChange("phone", e.target.value)}
                                                        placeholder="Enter phone number (min 6 digits)"
                                                        className={errors.phone ? "border-red-500" : ""}
                                                    />
                                                    {errors.phone && (
                                                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor="mobile" className="mb-2">Mobile</Label>
                                                    <Input
                                                        id="mobile"
                                                        value={contactData.mobile}
                                                        onChange={(e) => handleChange("mobile", e.target.value)}
                                                        placeholder="Enter mobile number (min 6 digits)"
                                                        className={errors.mobile ? "border-red-500" : ""}
                                                    />
                                                    {errors.mobile && (
                                                        <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="unique_external_id" className="mb-2">Unique external ID</Label>
                                                <Input
                                                    id="unique_external_id"
                                                    value={contactData.unique_external_id}
                                                    onChange={(e) => handleChange("unique_external_id", e.target.value)}
                                                    placeholder="Enter unique ID"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="other-emails" className="mb-2">Other Emails</Label>
                                                <div className="flex flex-col space-y-2">
                                                    <Input
                                                        id="other-emails"
                                                        value={otherEmailInput}
                                                        onChange={(e) => setOtherEmailInput(e.target.value)}
                                                        onKeyDown={handleAddOtherEmail}
                                                        placeholder="Add another email and press Enter"
                                                        className={errors.otherEmailInput ? "border-red-500" : ""}
                                                    />
                                                    {errors.otherEmailInput && (
                                                        <p className="text-red-500 text-sm mt-1">{errors.otherEmailInput}</p>
                                                    )}
                                                    {contactData.other_emails.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {contactData.other_emails.map((email, index) => (
                                                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" /> {email}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveOtherEmail(email)}
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
                                        </div>

                                        <div className="w-full md:w-1/3">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <Label htmlFor="avatar" className="mb-2">Profile Picture</Label>
                                                <div className="relative">
                                                    <Avatar className="h-32 w-32">
                                                        {avatarPreview ? (
                                                            <AvatarImage src={avatarPreview} alt="Contact avatar" />
                                                        ) : null}
                                                        <AvatarFallback className="text-3xl bg-blue-100 text-blue-800">
                                                            {"?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {avatarPreview && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 rounded-full p-1 h-8 w-8"
                                                            onClick={removeAvatar}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        {avatarPreview ? "Change Photo" : "Upload Photo"}
                                                        <input
                                                            id="avatar"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleAvatarChange}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="additional" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="company" className="mb-2">Company</Label>
                                            <Select
                                                value={contactData.company_id || "none"}
                                                onValueChange={(value) => handleChange("company_id", value)}
                                            >
                                                <SelectTrigger id="company">
                                                    <SelectValue placeholder="Select company" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {Object.entries(companyMap || {}).map(([id, name]) => (
                                                        <SelectItem key={id} value={id}>
                                                            {name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="job_title" className="mb-2">Job Title</Label>
                                            <Input
                                                id="job_title"
                                                value={contactData.job_title}
                                                onChange={(e) => handleChange("job_title", e.target.value)}
                                                placeholder="Enter job title"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="address" className="mb-2">Address</Label>
                                        <Textarea
                                            id="address"
                                            value={contactData.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            placeholder="Enter address"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="mb-2">Description/Notes</Label>
                                        <Textarea
                                            id="description"
                                            value={contactData.description}
                                            onChange={(e) => handleChange("description", e.target.value)}
                                            placeholder="Add notes about this contact"
                                            rows={4}
                                        />
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
                                            {contactData.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {contactData.tags.map((tag, index) => (
                                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTag(tag)}
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
                                </TabsContent>
                            </Tabs>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/contacts")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isEditMode ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        isEditMode ? "Update Contact" : "Create Contact"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </main>
            </div>
        </div>
    );
};

const ContactCreate = () => {
    return (
        <ErrorProvider>
            <ContactCreateContent />
        </ErrorProvider>
    );
};

export default ContactCreate;
