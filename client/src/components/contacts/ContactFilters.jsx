import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ContactFilters = ({ onApply }) => {
    const [filters, setFilters] = useState({
        job_title: "",
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
            created_after: "",
            created_before: "",
            updated_after: "",
            updated_before: ""
        });

        onApply({});
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="text-center py-4">Loading filters...</div>
                ) : (
                    <>
                        <div>
                            <Label htmlFor="job_title" className="mb-2 block">Job Title</Label>
                            <Input
                                id="job_title"
                                value={filters.job_title}
                                onChange={(e) => handleFilterChange("job_title", e.target.value)}
                                placeholder="Filter by job title"
                            />
                        </div>

                        <div>
                            <Label htmlFor="created-after" className="mb-2 block">Created After</Label>
                            <Input
                                id="created-after"
                                type="date"
                                value={filters.created_after}
                                onChange={(e) => handleFilterChange("created_after", e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="created-before" className="mb-2 block">Created Before</Label>
                            <Input
                                id="created-before"
                                type="date"
                                value={filters.created_before}
                                onChange={(e) => handleFilterChange("created_before", e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="updated-after" className="mb-2 block">Updated After</Label>
                            <Input
                                id="updated-after"
                                type="date"
                                value={filters.updated_after}
                                onChange={(e) => handleFilterChange("updated_after", e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="updated-before" className="mb-2 block">Updated Before</Label>
                            <Input
                                id="updated-before"
                                type="date"
                                value={filters.updated_before}
                                onChange={(e) => handleFilterChange("updated_before", e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <Button className="w-full" onClick={handleApplyFilters}>
                                Apply Filters
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleResetFilters}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ContactFilters;
