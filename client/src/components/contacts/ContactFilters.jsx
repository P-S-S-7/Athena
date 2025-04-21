import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { Separator } from "@/components/ui/separator";
import { Filter, FilterX, Calendar as CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ContactFilters = ({ onApply }) => {
    const { companyMap } = useData();

    const [filters, setFilters] = useState({
        job_title: "",
        company_id: "",
        created_after: "",
        created_before: "",
        updated_after: "",
        updated_before: "",
    });

    const [loading, setLoading] = useState(false);

    const handleFilterChange = (field, value) => {
        setFilters({
            ...filters,
            [field]: value
        });
    };

    const handleApplyFilters = () => {
        const cleanFilters = { ...filters };

        if (cleanFilters.created_after) {
            cleanFilters.created_after = new Date(cleanFilters.created_after).toISOString();
        }

        if (cleanFilters.created_before) {
            cleanFilters.created_before = new Date(cleanFilters.created_before).toISOString();
        }

        if (cleanFilters.updated_after) {
            cleanFilters.updated_after = new Date(cleanFilters.updated_after).toISOString();
        }

        if (cleanFilters.updated_before) {
            cleanFilters.updated_before = new Date(cleanFilters.updated_before).toISOString();
        }

        Object.keys(cleanFilters).forEach(key => {
            if (cleanFilters[key] === "" || cleanFilters[key] === null) {
                delete cleanFilters[key];
            }
        });

        onApply(cleanFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            job_title: "",
            company_id: "",
            created_after: "",
            created_before: "",
            updated_after: "",
            updated_before: ""
        });

        onApply({});
    };

    const anyFilterActive = () => {
        return Object.values(filters).some(value => value !== "");
    };

    return (
        <Card className="shadow-sm border-gray-200 rounded-none">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-3 pt-3 rounded-none">
                <CardTitle className="flex items-center text-base">
                    <Filter className="mr-2 h-4 w-4 text-gray-500" />
                    Filter Contacts
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                        <div className="h-5 w-5 animate-spin mr-2 border-2 border-gray-500 border-t-transparent rounded-full" />
                        <span>Loading filters...</span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="space-y-3">
                            <div className="space-y-3">
                                <div className="flex items-center mb-1">
                                    <Search className="h-4 w-4 mr-2 text-gray-500" />
                                    <Label htmlFor="job_title" className="text-sm font-medium text-gray-700">
                                        Job Title
                                    </Label>
                                </div>
                                <Input
                                    id="job_title"
                                    value={filters.job_title}
                                    onChange={(e) => handleFilterChange("job_title", e.target.value)}
                                    placeholder="Filter by job title"
                                    className="h-8 text-sm"
                                />
                            </div>

                            <div className="space-y-2 mb-3">
                                <div className="flex items-center mb-1">
                                    <Search className="h-4 w-4 mr-2 text-gray-500" />
                                    <Label htmlFor="company_id" className="text-sm font-medium text-gray-700">
                                        Company
                                    </Label>
                                </div>
                                <Select
                                    value={filters.company_id}
                                    onValueChange={(value) => handleFilterChange("company_id", value)}
                                >
                                    <SelectTrigger id="company_id" className="w-full h-8 text-sm">
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Any">All Companies</SelectItem>
                                        {Object.entries(companyMap).map(([id, name]) => (
                                            <SelectItem key={id} value={id}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                                <div className="flex items-center mb-1">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                                    <Label htmlFor="date-filters" className="text-sm font-medium text-gray-700">
                                        Creation Date
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <Label htmlFor="created-after" className="text-xs text-gray-600 ml-1">
                                            From
                                        </Label>
                                        <Input
                                            id="created-after"
                                            type="date"
                                            value={filters.created_after}
                                            onChange={(e) => handleFilterChange("created_after", e.target.value)}
                                            className="h-8 text-sm mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="created-before" className="text-xs text-gray-600 ml-1">
                                            To
                                        </Label>
                                        <Input
                                            id="created-before"
                                            type="date"
                                            value={filters.created_before}
                                            onChange={(e) => handleFilterChange("created_before", e.target.value)}
                                            className="h-8 text-sm mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                                <div className="flex items-center mb-1">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                                    <Label htmlFor="update-filters" className="text-sm font-medium text-gray-700">
                                        Last Updated
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <Label htmlFor="updated-after" className="text-xs text-gray-600 ml-1">
                                            From
                                        </Label>
                                        <Input
                                            id="updated-after"
                                            type="date"
                                            value={filters.updated_after}
                                            onChange={(e) => handleFilterChange("updated_after", e.target.value)}
                                            className="h-8 text-sm mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="updated-before" className="text-xs text-gray-600 ml-1">
                                            To
                                        </Label>
                                        <Input
                                            id="updated-before"
                                            type="date"
                                            value={filters.updated_before}
                                            onChange={(e) => handleFilterChange("updated_before", e.target.value)}
                                            className="h-8 text-sm mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Button
                                    size="sm"
                                    className="w-full gap-1.5 flex items-center bg-slate-800 hover:bg-slate-900"
                                    onClick={handleApplyFilters}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Apply Filters
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                        "w-full gap-1.5 flex items-center",
                                        anyFilterActive()
                                            ? "text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                            : "text-gray-500"
                                    )}
                                    onClick={handleResetFilters}
                                    disabled={!anyFilterActive()}
                                >
                                    <FilterX className="h-3.5 w-3.5" />
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ContactFilters;
