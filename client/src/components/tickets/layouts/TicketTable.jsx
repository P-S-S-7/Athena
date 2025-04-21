import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";

const TicketTable = ({
    tickets,
    selectedTickets,
    onSelectTicket,
    statuses,
    priorities
}) => {
    const navigate = useNavigate();
    const { contactMap } = useData();
    const getPriorityBadge = (priority) => {
        const priorityColors = {
            1: "bg-green-100 text-green-800",
            2: "bg-blue-100 text-blue-800",
            3: "bg-yellow-100 text-yellow-800",
            4: "bg-red-100 text-red-800",
        };

        return (
            <Badge className={priorityColors[priority] || "bg-gray-100"}>
                {priorities[priority] || "Unknown"}
            </Badge>
        );
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            2: "bg-yellow-100 text-yellow-800",
            3: "bg-purple-100 text-purple-800",
            4: "bg-green-100 text-green-800",
            5: "bg-gray-100 text-gray-800",
        };

        return (
            <Badge className={statusColors[status] || "bg-gray-100"}>
                {statuses[status] || "Unknown"}
            </Badge>
        );
    };

    return (
        <Table className="bg-white rounded-lg shadow-sm">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Due By</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? (
                    tickets.map(ticket => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedTickets.includes(ticket.id)}
                                    onCheckedChange={(checked) => onSelectTicket(ticket.id, checked)}
                                />
                            </TableCell>
                            <TableCell className="font-medium" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                {ticket.subject.length > 100
                                ? ticket.subject.slice(0, ticket.subject.lastIndexOf(" ", 100)) + "..."
                                : ticket.subject}</TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>{contactMap[ticket.requester_id] || "Unknown" }</TableCell>
                            <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{ticket.due_by ? new Date(ticket.due_by).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                            No tickets found. Adjust your filters or create a new ticket.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default TicketTable;
