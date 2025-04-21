import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Loader2, X, TicketIcon, MessageSquare, User } from "lucide-react";
import ticketService from "@/services/ticketService";
import { useData } from "@/contexts/DataContext";

const MergeTicketDialog = ({ isOpen, onClose, primaryTicket, onMerge }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('id');
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { contactMap } = useData();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedTickets([]);
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await ticketService.getTickets();

      const filteredTickets = result.tickets.filter(ticket => {
        if (ticket.id === primaryTicket.id || ticket.status === 4 || ticket.status === 5) {
          return false;
        }

        switch (searchType) {
          case 'id':
            return ticket.id.toString().includes(query);

          case 'subject':
            return ticket.subject.toLowerCase().includes(query.toLowerCase());

          case 'contact':
            const contactName = contactMap[ticket.requester_id] || '';
            return contactName.toLowerCase().includes(query.toLowerCase());

          default:
            return false;
        }
      });

      setSearchResults(filteredTickets);
    } catch (error) {
      console.error("Failed to search tickets:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case 'id':
        return 'Search by ticket ID (min 2 characters)';
      case 'subject':
        return 'Search by ticket subject (min 2 characters)';
      case 'contact':
        return 'Search by contact name (min 2 characters)';
      default:
        return 'Search tickets';
    }
  };

  const toggleTicketSelection = (ticketId) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    } else {
      setSelectedTickets([...selectedTickets, ticketId]);
    }
  };

  const handleMerge = async () => {
    if (selectedTickets.length === 0) return;

    setIsMerging(true);
    try {
      const ticketIdsAsInts = selectedTickets.map(id =>
        typeof id === 'string' ? parseInt(id, 10) : id
      );

      await onMerge(ticketIdsAsInts);
      onClose();
    } catch (error) {
      console.error("Merge failed:", error);
      alert(`Failed to merge tickets: ${error.message || 'Unknown error'}`);
    } finally {
      setIsMerging(false);
    }
  };

  const getTicketById = (id) => {
    return searchResults.find(t => t.id === id) || { subject: 'Unknown ticket' };
  };

  const getSearchTypeIcon = () => {
    switch (searchType) {
      case 'id':
        return <TicketIcon className="h-4 w-4 text-blue-500" />;
      case 'subject':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'contact':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] w-4/5 max-h-[85vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Merge Tickets</DialogTitle>
          <DialogDescription className="text-base mt-1">
            Select tickets to merge into <span className="font-semibold">#{primaryTicket.id}: {primaryTicket.subject}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-2">
          <div className="bg-gray-50 p-4 rounded-md">
            <Label className="block text-sm font-medium text-gray-700 mb-3">Search by:</Label>
            <RadioGroup
              value={searchType}
              onValueChange={setSearchType}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="id" id="search-id" />
                <Label htmlFor="search-id" className="flex items-center cursor-pointer">
                  <TicketIcon className="mr-1 h-4 w-4 text-blue-500" />
                  Ticket ID
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subject" id="search-subject" />
                <Label htmlFor="search-subject" className="flex items-center cursor-pointer">
                  <MessageSquare className="mr-1 h-4 w-4 text-green-500" />
                  Subject
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contact" id="search-contact" />
                <Label htmlFor="search-contact" className="flex items-center cursor-pointer">
                  <User className="mr-1 h-4 w-4 text-purple-500" />
                  Contact
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2 border rounded-md p-3">
            {getSearchTypeIcon()}
            <Input
              placeholder={getSearchPlaceholder()}
              className="border-0 focus-visible:ring-0 text-base h-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="min-h-[260px]">
            {isSearching ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                <p>Searching tickets...</p>
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="p-8 text-center text-gray-500">
                Enter at least 2 characters to search for tickets
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tickets found matching your search
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="flex items-center px-5 py-3 bg-gray-100 border-b">
                  <div className="w-1/12 font-medium">ID</div>
                  <div className="w-7/12 font-medium">Subject</div>
                  <div className="w-3/12 font-medium">Contact</div>
                  <div className="w-1/12 text-center font-medium">Select</div>
                </div>

                <div className="divide-y max-h-[260px] overflow-y-auto">
                  {searchResults.map(ticket => (
                    <div key={ticket.id} className="px-5 py-3 flex items-center hover:bg-gray-50">
                      <div className="w-1/12 text-gray-600 font-medium">#{ticket.id}</div>
                      <div className="w-7/12 truncate">
                            {ticket.subject.length > 40 ? `${ticket.subject.slice(0, 40)}...` : ticket.subject}
                        </div>
                      <div className="w-3/12 truncate text-gray-600">
                        {contactMap[ticket.requester_id] || 'Unknown'}
                      </div>
                      <div className="w-1/12 text-center">
                        <Checkbox
                          checked={selectedTickets.includes(ticket.id)}
                          onCheckedChange={() => toggleTicketSelection(ticket.id)}
                          className="h-5 w-5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedTickets.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-md">
              <Label className="block font-medium text-base mb-3">Selected Tickets ({selectedTickets.length}):</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTickets.map(id => {
                  const ticket = getTicketById(id);
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1 py-1.5 px-3 text-sm">
                      #{id} {ticket.subject.substring(0, 20)}{ticket.subject.length > 20 ? '...' : ''}
                      <button
                        onClick={() => toggleTicketSelection(id)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={isMerging} className="px-4">
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={selectedTickets.length === 0 || isMerging}
            className="bg-blue-600 hover:bg-blue-700 px-4"
          >
            {isMerging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Merging...
              </>
            ) : (
              `Merge ${selectedTickets.length} ticket${selectedTickets.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeTicketDialog;
