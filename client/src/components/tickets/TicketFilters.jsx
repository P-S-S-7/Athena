import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { X, Check } from "lucide-react";
import ticketService from "@/services/ticketService";
import { sourceMap, statusMap, priorityMap, agentMap, groupMap } from "@/utils/freshdeskMappings";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TicketFilters = ({ onApply }) => {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        created_after: "",
        created_before: ""
    });
    const [multiSelectFilters, setMultiSelectFilters] = useState({});

    useEffect(() => {
        const fetchTicketFields = async () => {
            try {
                setLoading(true);
                const ticketFields = await ticketService.getTicketFields();

                const fieldsWithChoices = ticketFields.filter(field => field.choices);
                setAvailableFilters(fieldsWithChoices);

                const initialFilters = {
                    created_after: "",
                    created_before: ""
                };

                const initialMultiSelectFilters = {
                    status: [],
                    priority: [],
                    source: [],
                    agent: [],
                    group: [],
                };

                fieldsWithChoices.forEach(field => {
                    if (isNestedField(field)) {
                        initialFilters[field.name] = "";
                    } else if (!initialMultiSelectFilters[field.name]) {
                        initialMultiSelectFilters[field.name] = [];
                    }
                });

                setFilters(initialFilters);
                setMultiSelectFilters(initialMultiSelectFilters);
            } catch (error) {
                console.error("Error fetching ticket fields:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketFields();
    }, []);

    const handleFilterChange = (field, value) => {
        const newValue = value === "_any_" ? "" : value;

        setFilters({
            ...filters,
            [field]: newValue
        });
    };

    const toggleMultiSelectOption = (field, value) => {
        if (!multiSelectFilters[field]) {
            setMultiSelectFilters({ ...multiSelectFilters, [field]: [value] });
            return;
        }

        const currentValues = [...multiSelectFilters[field]];

        if (currentValues.includes(value)) {
            setMultiSelectFilters({
                ...multiSelectFilters,
                [field]: currentValues.filter(v => v !== value)
            });
        } else {
            setMultiSelectFilters({
                ...multiSelectFilters,
                [field]: [...currentValues, value]
            });
        }
    };

    const removeMultiSelectOption = (field, value) => {
        if (!multiSelectFilters[field]) return;

        setMultiSelectFilters({
            ...multiSelectFilters,
            [field]: multiSelectFilters[field].filter(v => v !== value)
        });
    };

    const getSelectedOptionsLabel = (field) => {
        const values = multiSelectFilters[field] || [];
        if (values.length === 0) return "Any";
        if (values.length === 1) {
            if (field === 'status' && statusMap[values[0]]) return statusMap[values[0]];
            if (field === 'priority' && priorityMap[values[0]]) return priorityMap[values[0]];
            if (field === 'source' && sourceMap[values[0]]) return sourceMap[values[0]];
            if (field === 'agent' && agentMap[values[0]]) return agentMap[values[0]];
            if (field === 'group' && groupMap[values[0]]) return groupMap[values[0]];
            return values[0];
        }
        return `${values.length} selected`;
    };

    const handleApplyFilters = () => {
        const cleanFilters = { ...filters };

        if(cleanFilters.created_after) {
            cleanFilters.created_after = new Date(cleanFilters.created_after).toISOString();
        }

        if(cleanFilters.created_before) {
            cleanFilters.created_before = new Date(cleanFilters.created_before).toISOString();
        }

        Object.keys(multiSelectFilters).forEach(key => {
            if (multiSelectFilters[key] && multiSelectFilters[key].length > 0) {
                cleanFilters[key] = multiSelectFilters[key].map(value => {
                    if (['status', 'priority', 'source', 'agent', 'group'].includes(key)) {
                        return parseInt(value, 10);
                    }
                    return value;
                });
            }
        });

        const finalFilters = {};

        for (const key in cleanFilters) {
            if (key.startsWith('cf_') && typeof cleanFilters[key] === 'string' && cleanFilters[key].includes('|')) {
                const values = cleanFilters[key].split('|');

                const parentField = key;
                finalFilters[parentField] = values[0] || "";

                const nestedFields = availableFilters.find(field => field.name === parentField)?.nested_ticket_fields || [];

                for (let i = 1; i < values.length && i <= nestedFields.length; i++) {
                    if (values[i] && nestedFields[i-1]) {
                        const nestedFieldName = nestedFields[i-1].name;
                        finalFilters[nestedFieldName] = values[i];
                    }
                }
            } else {
                finalFilters[key] = cleanFilters[key];
            }
        }

        onApply(finalFilters);
    };

    const handleResetFilters = () => {
        const resetFilters = {};
        Object.keys(filters).forEach(key => {
            resetFilters[key] = "";
        });
        setFilters(resetFilters);

        const resetMultiSelectFilters = {};
        Object.keys(multiSelectFilters).forEach(key => {
            resetMultiSelectFilters[key] = [];
        });
        setMultiSelectFilters(resetMultiSelectFilters);

        onApply({});
    };

    const isNestedField = (field) => {
        if (!field.choices || typeof field.choices !== 'object' || Array.isArray(field.choices)) {
            return false;
        }

        const values = Object.values(field.choices);
        return values.some(value =>
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null
        );
    };

    const getOptionsForField = (field) => {
        const fieldName = field.name;

        if (fieldName === 'status') {
            return Object.entries(statusMap).map(([id, name]) => ({ id, name }));
        } else if (fieldName === 'priority') {
            return Object.entries(priorityMap).map(([id, name]) => ({ id, name }));
        } else if (fieldName === 'source') {
            return Object.entries(sourceMap).map(([id, name]) => ({ id, name }));
        } else if (fieldName === 'agent') {
            return Object.entries(agentMap).map(([id, name]) => ({ id, name }));
        } else if (fieldName === 'group') {
            return Object.entries(groupMap).map(([id, name]) => ({ id, name }));
        } else if (field.choices) {
            if (Array.isArray(field.choices)) {
                return field.choices.map(choice => ({ id: choice, name: choice }));
            } else if (typeof field.choices === 'object') {
                return Object.entries(field.choices).map(([id, name]) => ({
                    id,
                    name: typeof name === 'string' ? name : id
                }));
            }
        }

        return [];
    };

    const NestedDropdowns = ({ field, value, onChange }) => {
        const [level1, setLevel1] = useState("");
        const [level2, setLevel2] = useState("");
        const [level3, setLevel3] = useState("");

        useEffect(() => {
            if (value) {
                try {
                    const [lvl1, lvl2, lvl3] = value.split('|');
                    setLevel1(lvl1 || "");
                    setLevel2(lvl2 || "");
                    setLevel3(lvl3 || "");
                } catch (error) {
                    console.error("Error parsing nested value:", error);
                }
            } else {
                setLevel1("");
                setLevel2("");
                setLevel3("");
            }
        }, [value]);

        const getLevel2Options = () => {
            if (!level1 || !field.choices[level1]) return [];
            return Object.keys(field.choices[level1]);
        };

        const getLevel3Options = () => {
            if (!level1 || !level2 || !field.choices[level1] || !field.choices[level1][level2]) return [];
            return field.choices[level1][level2];
        };

        const handleLevelChange = (level, newValue) => {
            if (level === 1) {
                if (newValue === "_any_") {
                    setLevel1("");
                    setLevel2("");
                    setLevel3("");
                    onChange("");
                } else {
                    setLevel1(newValue);
                    setLevel2("");
                    setLevel3("");
                    onChange(`${newValue}`);
                }
            } else if (level === 2) {
                if (newValue === "_any_") {
                    setLevel2("");
                    setLevel3("");
                    onChange(`${level1}`);
                } else {
                    setLevel2(newValue);
                    setLevel3("");
                    onChange(`${level1}|${newValue}`);
                }
            } else if (level === 3) {
                if (newValue === "_any_") {
                    setLevel3("");
                    onChange(`${level1}|${level2}`);
                } else {
                    setLevel3(newValue);
                    onChange(`${level1}|${level2}|${newValue}`);
                }
            }
        };

        return (
            <div className="space-y-3">
                <div>
                    <Label htmlFor={`${field.name}-level1`} className="mb-2 block">
                        {field.label}
                    </Label>
                    <Select
                        value={level1 || "_any_"}
                        onValueChange={(value) => handleLevelChange(1, value)}
                    >
                        <SelectTrigger id={`${field.name}-level1`}>
                            <SelectValue placeholder={`Any ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_any_">Any</SelectItem>
                            {Object.keys(field.choices).map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {level1 && level1 !== "_any_" && (
                    <div className="ml-4 pl-2 border-l-2 border-gray-200">
                        <Label htmlFor={`${field.name}-level2`} className="mb-2 block">
                            {field.nested_ticket_fields?.[0]?.label || 'Subcategory'}
                        </Label>
                        <Select
                            value={level2 || "_any_"}
                            onValueChange={(value) => handleLevelChange(2, value)}
                        >
                            <SelectTrigger id={`${field.name}-level2`}>
                                <SelectValue placeholder={`Any subcategory`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_any_">Any</SelectItem>
                                {getLevel2Options().map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {level1 && level1 !== "_any_" && level2 && level2 !== "_any_" && getLevel3Options().length > 0 && (
                    <div className="ml-8 pl-2 border-l-2 border-gray-200">
                        <Label htmlFor={`${field.name}-level3`} className="mb-2 block">
                            {field.nested_ticket_fields?.[1]?.label || 'Item'}
                        </Label>
                        <Select
                            value={level3 || "_any_"}
                            onValueChange={(value) => handleLevelChange(3, value)}
                        >
                            <SelectTrigger id={`${field.name}-level3`}>
                                <SelectValue placeholder={`Any item`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_any_">Any</SelectItem>
                                {getLevel3Options().map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        );
    };

    const MultiSelectFilter = ({ field }) => {
        const [open, setOpen] = useState(false);
        const fieldValues = multiSelectFilters[field.name] || [];
        const options = getOptionsForField(field);

        const getDisplayValue = (id) => {
            const found = options.find(option => option.id === id);
            return found ? found.name : id;
        };

        return (
            <div className="space-y-2">
                <Label htmlFor={field.name} className="mb-2 block">{field.label}</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between text-left"
                        >
                            {getSelectedOptionsLabel(field.name)}
                            <X
                                className={cn(
                                    "ml-2 h-4 w-4 shrink-0 opacity-50",
                                    fieldValues.length > 0 ? "opacity-100" : "hidden"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMultiSelectFilters({
                                        ...multiSelectFilters,
                                        [field.name]: []
                                    });
                                }}
                            />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start" side="bottom">
                        <Command>
                            <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
                            <CommandList>
                                <CommandEmpty>No {field.label.toLowerCase()} found.</CommandEmpty>
                                <CommandGroup>
                                    {options.map(option => (
                                        <CommandItem
                                            key={option.id}
                                            value={option.name}
                                            onSelect={() => toggleMultiSelectOption(field.name, option.id)}
                                        >
                                            <div className="flex items-center">
                                                <div className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    fieldValues.includes(option.id) ? "bg-primary text-primary-foreground" : "opacity-50"
                                                )}>
                                                    {fieldValues.includes(option.id) && <Check className="h-3 w-3" />}
                                                </div>
                                                {option.name}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {fieldValues.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {fieldValues.map(value => (
                            <Badge
                                key={value}
                                variant="secondary"
                                className="flex items-center gap-1"
                            >
                                {getDisplayValue(value)}
                                <button
                                    onClick={() => removeMultiSelectOption(field.name, value)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        );
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
                        {availableFilters.map(field => (
                            <div key={field.id} className="mb-4">
                                {isNestedField(field) ? (
                                    <NestedDropdowns
                                        field={field}
                                        value={filters[field.name] || ""}
                                        onChange={(value) => handleFilterChange(field.name, value)}
                                    />
                                ) : (
                                    <MultiSelectFilter field={field} />
                                )}
                            </div>
                        ))}

                        <div className="space-y-2">
                            <Label htmlFor="created-after" className="mb-2 block">Created After</Label>
                            <Input
                                id="created-after"
                                type="date"
                                value={filters.created_after}
                                onChange={(e) => handleFilterChange("created_after", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="created-before" className="mb-2 block">Created Before</Label>
                            <Input
                                id="created-before"
                                type="date"
                                value={filters.created_before}
                                onChange={(e) => handleFilterChange("created_before", e.target.value)}
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

export default TicketFilters;
