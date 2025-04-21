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
import {
    X, Check, Calendar, FilterX, Filter, ChevronRight,
    Search, ArrowRight, Calendar as CalendarIcon, Loader2
} from "lucide-react";
import ticketService from "@/services/ticketService";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useError } from "@/contexts/ErrorContext";
import { useData } from "@/contexts/DataContext";
import { Separator } from "@/components/ui/separator";

const TicketFilters = ({ onApply }) => {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        created_after: "",
        created_before: ""
    });
    const [multiSelectFilters, setMultiSelectFilters] = useState({});
    const { handleError } = useError();
    const { statusMap, priorityMap, sourceMap, agentMap, groupMap } = useData();

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
                handleError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketFields();
    }, [handleError]);

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

    const anyFilterActive = () => {
        const hasDateFilter = filters.created_after || filters.created_before;

        const hasNestedFilter = Object.keys(filters).some(key =>
            key.startsWith('cf_') && filters[key]
        );

        const hasMultiSelect = Object.values(multiSelectFilters).some(
            values => values && values.length > 0
        );

        return hasDateFilter || hasNestedFilter || hasMultiSelect;
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
                <div className="mb-1">
                    <div className="flex items-center">
                        <span className="bg-blue-100 p-1 rounded-md mr-2">
                            <ChevronRight className="h-3.5 w-3.5 text-blue-700" />
                        </span>
                        <Label htmlFor={`${field.name}-level1`} className="text-sm font-medium text-gray-700">
                            {field.label}
                        </Label>
                    </div>
                    <Select
                        value={level1 || "_any_"}
                        onValueChange={(value) => handleLevelChange(1, value)}
                    >
                        <SelectTrigger id={`${field.name}-level1`} className="w-full mt-1 h-8 text-sm">
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
                    <div className="ml-4 pl-3 border-l border-blue-200">
                        <div className="flex items-center mb-1">
                            <ArrowRight className="h-3 w-3 text-blue-500 mr-2" />
                            <Label htmlFor={`${field.name}-level2`} className="text-xs font-medium text-gray-600">
                                {field.nested_ticket_fields?.[0]?.label || 'Subcategory'}
                            </Label>
                        </div>
                        <Select
                            value={level2 || "_any_"}
                            onValueChange={(value) => handleLevelChange(2, value)}
                        >
                            <SelectTrigger id={`${field.name}-level2`} className="w-full h-8 text-sm">
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
                    <div className="ml-8 pl-3 border-l border-blue-200">
                        <div className="flex items-center mb-1">
                            <ArrowRight className="h-3 w-3 text-blue-500 mr-2" />
                            <Label htmlFor={`${field.name}-level3`} className="text-xs font-medium text-gray-600">
                                {field.nested_ticket_fields?.[1]?.label || 'Item'}
                            </Label>
                        </div>
                        <Select
                            value={level3 || "_any_"}
                            onValueChange={(value) => handleLevelChange(3, value)}
                        >
                            <SelectTrigger id={`${field.name}-level3`} className="w-full h-8 text-sm">
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

        const getColorForValue = (fieldName, value) => {
            if (fieldName === 'status') {
                const statusColors = {
                    '2': 'bg-amber-100 text-amber-800 border-amber-200',
                    '3': 'bg-purple-100 text-purple-800 border-purple-200',
                    '4': 'bg-green-100 text-green-800 border-green-200',
                    '5': 'bg-gray-100 text-gray-800 border-gray-200'
                };
                return statusColors[value] || 'bg-blue-100 text-blue-800 border-blue-200';
            }

            if (fieldName === 'priority') {
                const priorityColors = {
                    '1': 'bg-green-100 text-green-800 border-green-200',
                    '2': 'bg-blue-100 text-blue-800 border-blue-200',
                    '3': 'bg-amber-100 text-amber-800 border-amber-200',
                    '4': 'bg-red-100 text-red-800 border-red-200'
                };
                return priorityColors[value] || 'bg-blue-100 text-blue-800 border-blue-200';
            }

            return 'bg-blue-100 text-blue-800 border-blue-200';
        };

        return (
            <div className="space-y-2 mb-3">
                <div className="flex items-center mb-1">
                    <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                        {field.label}
                    </Label>
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between text-left h-8 text-sm"
                        >
                            <span className="truncate">
                                {getSelectedOptionsLabel(field.name)}
                            </span>
                            {fieldValues.length > 0 ? (
                                <X
                                    className="ml-2 h-3.5 w-3.5 shrink-0 text-gray-500 hover:text-gray-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMultiSelectFilters({
                                            ...multiSelectFilters,
                                            [field.name]: []
                                        });
                                    }}
                                />
                            ) : (
                                <Search className="ml-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[240px]" align="start" side="right">
                        <Command>
                            <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} className="h-9" />
                            <CommandList>
                                <CommandEmpty>No {field.label.toLowerCase()} found.</CommandEmpty>
                                <CommandGroup>
                                    {options.map(option => (
                                        <CommandItem
                                            key={option.id}
                                            value={option.name}
                                            onSelect={() => toggleMultiSelectOption(field.name, option.id)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center w-full">
                                                <div className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                                                    fieldValues.includes(option.id)
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "border-gray-300 opacity-70"
                                                )}>
                                                    {fieldValues.includes(option.id) && <Check className="h-3 w-3" />}
                                                </div>
                                                <span className="flex-grow truncate">{option.name}</span>
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
                                variant="outline"
                                className={cn("flex items-center gap-1 text-xs py-0.5",
                                    getColorForValue(field.name, value)
                                )}
                            >
                                {getDisplayValue(value)}
                                <button
                                    onClick={() => removeMultiSelectOption(field.name, value)}
                                    className="ml-1 text-current opacity-70 hover:opacity-100"
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
        <Card className="shadow-sm border-gray-200 rounded-none">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-3 pt-3 rounded-none">
                <CardTitle className="flex items-center text-base">
                    <Filter className="mr-2 h-4 w-4 text-gray-500" />
                    Filter Tickets
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Loading filters...</span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="space-y-3">
                            {availableFilters.filter(field => !isNestedField(field)).map(field => (
                                <MultiSelectFilter key={field.id} field={field} />
                            ))}

                            {availableFilters.filter(isNestedField).length > 0 && (
                                <Separator className="my-4" />
                            )}

                            {availableFilters.filter(isNestedField).map(field => (
                                <div key={field.id} className="mb-4">
                                    <NestedDropdowns
                                        field={field}
                                        value={filters[field.name] || ""}
                                        onChange={(value) => handleFilterChange(field.name, value)}
                                    />
                                </div>
                            ))}

                            <Separator className="my-4" />

                            <div className="space-y-3">
                                <div className="flex items-center mb-1">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                                    <Label htmlFor="date-filters" className="text-sm font-medium text-gray-700">
                                        Date Range
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

export default TicketFilters;
