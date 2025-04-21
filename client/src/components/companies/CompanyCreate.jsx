import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, X, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import companyService from "@/services/companyService";
import { showSuccessToast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import { useError } from "../../contexts/ErrorContext";
import Sidebar from "../../utils/Sidebar";
import Header from "../../utils/Header";
import { useData } from "../../contexts/DataContext";

const CompanyCreate = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();
    const isEditMode = Boolean(companyId);
    const { healthScoreMap, accountTierMap, industryMap } = useData();

    const [companyData, setCompanyData] = useState({
        name: "",
        description: "",
        domains: [],
        note: "",
        health_score: "",
        account_tier: "",
        industry: "",
        renewal_date: null,
        custom_fields: {}
    });

    const [domainInput, setDomainInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(isEditMode);
    const [fieldState, setFieldState] = useState({});
    const [errors, setErrors] = useState({});
    const [isTouched, setIsTouched] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFormLoading(true);

                if (isEditMode) {
                    const { company } = await companyService.getCompany(companyId);

                    setCompanyData({
                        name: company.name || "",
                        description: company.description || "",
                        domains: company.domains || [],
                        note: company.note || "",
                        health_score: company.health_score || "",
                        account_tier: company.account_tier || "",
                        industry: company.industry || "",
                        renewal_date: company.renewal_date ? new Date(company.renewal_date) : null,
                        custom_fields: company.custom_fields || {}
                    });
                }
            } catch (error) {
                handleError(error);
            } finally {
                setFormLoading(false);
            }
        };

        fetchData();
    }, [companyId, isEditMode, handleError]);

    const handleChange = (field, value) => {
        setIsTouched(prev => ({ ...prev, [field]: true }));

        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setCompanyData({
                ...companyData,
                [parent]: {
                    ...companyData[parent],
                    [child]: value
                }
            });
        } else {
            setCompanyData({
                ...companyData,
                [field]: value
            });
        }

        setFieldState({
            ...fieldState,
            [field]: true
        });

        if (errors[field]) {
            setErrors(prev => {
                const updatedErrors = {...prev};
                delete updatedErrors[field];
                return updatedErrors;
            });
        }
    };

    const handleBlur = (field) => {
        setIsTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field) => {
        let newErrors = { ...errors };

        switch (field) {
            case 'name':
                if (!companyData.name) {
                    newErrors.name = "Company name is required";
                } else {
                    delete newErrors.name;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return !newErrors[field];
    };

    const handleAddDomain = (e) => {
        if (e.key === 'Enter' && domainInput.trim()) {
            e.preventDefault();

            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
            if (!domainRegex.test(domainInput.trim())) {
                setErrors({
                    ...errors,
                    domainInput: "Invalid domain format (e.g. example.com)"
                });
                return;
            }

            if (!companyData.domains.includes(domainInput.trim())) {
                setCompanyData({
                    ...companyData,
                    domains: [...companyData.domains, domainInput.trim()]
                });
                setErrors(prev => {
                    const updatedErrors = {...prev};
                    delete updatedErrors.domainInput;
                    delete updatedErrors.domains;
                    return updatedErrors;
                });
            }
            setDomainInput("");
        }
    };

    const handleRemoveDomain = (domainToRemove) => {
        setCompanyData({
            ...companyData,
            domains: companyData.domains.filter(domain => domain !== domainToRemove)
        });
    };

    const validateForm = () => {
        setIsTouched(prev => ({ ...prev, name: true }));

        const newErrors = {};
        let isValid = true;

        if (!companyData.name) {
            newErrors.name = "Company name is required";
            isValid = false;
        }

        setErrors(newErrors);
        setFieldState({
            ...fieldState,
            name: true
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

            const payload = { ...companyData };

            if(payload.renewal_date) {
                payload.renewal_date = format(payload.renewal_date, "yyyy-MM-dd");
            }

            if (isEditMode) {
                await companyService.updateCompany(companyId, payload);
                showSuccessToast("Company updated successfully", { autoClose: 3000 });
                setTimeout(() => {
                    navigate("/companies?refresh=true");
                }, 3000);
            } else {
                await companyService.createCompany(payload);
                showSuccessToast("Company created successfully", { autoClose: 3000 });
                setTimeout(() => {
                    navigate("/companies?refresh=true");
                }, 3000);
            }
        } catch (error) {
            if (error.message) {
                try {
                    const errorData = JSON.parse(error.message);
                    if (errorData.error) {
                        if (errorData.error.includes('domain')) {
                            setErrors({
                                ...errors,
                                domains: errorData.error
                            });
                        }
                        else if (errorData.error.includes('name')) {
                            setErrors({
                                ...errors,
                                name: errorData.error
                            });
                            setIsTouched(prev => ({ ...prev, name: true }));
                        } else {
                            handleError(error);
                        }
                    } else {
                        handleError(error);
                    }
                } catch {
                    handleError(error);
                }
            } else {
                handleError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                    <Header title={isEditMode ? "Edit Company" : "Create Company"} />
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
                    title={isEditMode ? "Edit Company" : "Create Company"}
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                />
                <main className="flex-grow p-6 overflow-auto">
                    <Card className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            <Tabs defaultValue="basic">
                                <TabsList className="mb-6">
                                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                                    <TabsTrigger value="additional">Additional Details</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="name" className="required mb-2">Company Name *</Label>
                                            <Input
                                                id="name"
                                                value={companyData.name || ""}
                                                onChange={(e) => handleChange("name", e.target.value)}
                                                onBlur={() => handleBlur("name")}
                                                placeholder="Enter company name"
                                                className={isTouched.name && errors.name ? "border-red-500" : ""}
                                            />
                                            {isTouched.name && errors.name && (
                                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="description" className="mb-2">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={companyData.description}
                                                onChange={(e) => handleChange("description", e.target.value)}
                                                placeholder="Enter company description"
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="domains" className="mb-2">Domains</Label>
                                            <div className="flex flex-col space-y-2">
                                                <Input
                                                    id="domains"
                                                    value={domainInput}
                                                    onChange={(e) => setDomainInput(e.target.value)}
                                                    onKeyDown={handleAddDomain}
                                                    placeholder="Add domain (e.g. example.com) and press Enter"
                                                    className={errors.domainInput || errors.domains ? "border-red-500" : ""}
                                                />
                                                {errors.domainInput && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.domainInput}</p>
                                                )}
                                                {errors.domains && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.domains}</p>
                                                )}
                                                {companyData.domains.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {companyData.domains.map((domain, index) => (
                                                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                                <Globe className="h-3 w-3" /> {domain}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveDomain(domain)}
                                                                    className="focus:outline-none"
                                                                >
                                                                    <X className="h-3 w-3 cursor-pointer" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                                                <div className="flex items-start">
                                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                                                    <p className="text-blue-800 text-sm">
                                                        Adding domains will automatically associate contacts with this company if their email domain matches.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="industry" className="mb-2">Industry</Label>
                                            <Select
                                                value={companyData.industry}
                                                onValueChange={(value) => handleChange("industry", value)}
                                            >
                                                <SelectTrigger id="industry">
                                                    <SelectValue placeholder="Select industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {Object.entries(industryMap || {}).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{key}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="additional" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="health_score" className="mb-2">Health Score</Label>
                                            <Select
                                                value={companyData.health_score}
                                                onValueChange={(value) => handleChange("health_score", value)}
                                            >
                                                <SelectTrigger id="health_score">
                                                    <SelectValue placeholder="Select health score" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {Object.entries(healthScoreMap || {}).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{key}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="account_tier" className="mb-2">Account Tier</Label>
                                            <Select
                                                value={companyData.account_tier}
                                                onValueChange={(value) => handleChange("account_tier", value)}
                                            >
                                                <SelectTrigger id="account_tier">
                                                    <SelectValue placeholder="Select account tier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {Object.entries(accountTierMap || {}).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{key}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="renewal_date" className="mb-2">Renewal Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="renewal_date"
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {companyData.renewal_date ?
                                                        format(companyData.renewal_date, "PPP") :
                                                        "Select renewal date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={companyData.renewal_date}
                                                    onSelect={(date) => handleChange("renewal_date", date)}
                                                    initialFocus
                                                />
                                                {companyData.renewal_date && (
                                                    <div className="p-2 border-t border-gray-200">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => handleChange("renewal_date", null)}
                                                        >
                                                            Clear date
                                                        </Button>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <Label htmlFor="note" className="mb-2">Notes</Label>
                                        <Textarea
                                            id="note"
                                            value={companyData.note}
                                            onChange={(e) => handleChange("note", e.target.value)}
                                            placeholder="Add internal notes about this company"
                                            rows={4}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/companies")}
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
                                        isEditMode ? "Update Company" : "Create Company"
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

export default CompanyCreate;
