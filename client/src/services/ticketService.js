import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL;

const ticketService = {
    getTickets: async (orderBy = 'created_at', orderType = 'desc', page = 1, perPage = 20, filters = {}) => {
        try {
            const params = {
                order_by: orderBy,
                order_type: orderType,
                page: page,
                per_page: perPage,
                ...filters
            };

            const response = await axios.get(`${API_URL}/api/tickets`, {
                params: params,
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching tickets:", error);
            throw handleApiError(error);
        }
    },

    getTicket: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching ticket:", error);
            throw handleApiError(error);
        }
    },

    getTicketConversations: async (ticketId) => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/${ticketId}/conversations`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching conversations:", error);
            throw handleApiError(error);
        }
    },

    addReply: async (ticketId, replyData, attachments = []) => {
        try {
            const formData = new FormData();

            Object.entries(replyData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(`reply[${key}]`, value);
                }
            });

            if (attachments && attachments.length > 0) {
                attachments.forEach((file, index) => {
                    formData.append(`attachments[${index}]`, file);
                });
            }

            const response = await axios.post(
                `${API_URL}/api/tickets/${ticketId}/reply`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error adding reply:", error);
            throw handleApiError(error);
        }
    },

    addNote: async (ticketId, noteData, attachments = []) => {
        try {
            const formData = new FormData();

            Object.entries(noteData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (typeof value === 'boolean') {
                        formData.append(`note[${key}]`, value ? 'true' : 'false');
                    } else {
                        formData.append(`note[${key}]`, value);
                    }
                }
            });

            if (attachments && attachments.length > 0) {
                attachments.forEach((file, index) => {
                    formData.append(`attachments[${index}]`, file);
                });
            }

            const response = await axios.post(
                `${API_URL}/api/tickets/${ticketId}/note`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error adding note:", error);
            throw handleApiError(error);
        }
    },

    deleteConversation: async (conversationId) => {
        try {
            console.log("Deleting conversation with ID:", conversationId);
            const response = await axios.delete(
                `${API_URL}/api/conversations/${conversationId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error("Error deleting conversation:", error);
            throw handleApiError(error);
        }
    },

    updateConversation: async (conversationId, formData) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/conversations/${conversationId}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error updating conversation:", error);
            throw handleApiError(error);
        }
    },

    forwardTicket: async (ticketId, forwardData) => {
        try {
            const payload = {
                body: forwardData.body,
                to_emails: forwardData.to_emails || [],
                cc_emails: forwardData.cc_emails || [],
                bcc_emails: forwardData.bcc_emails || []
            };

            if (forwardData.hasOwnProperty('include_original_attachments')) {
                payload.include_original_attachments = forwardData.include_original_attachments;
            }

            const response = await axios.post(
                `${API_URL}/api/tickets/${ticketId}/forward`,
                payload,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error forwarding ticket:", error);
            throw handleApiError(error);
        }
    },

    createTicket: async (ticketData, attachments = []) => {
        try {
            const formData = new FormData();

            Object.entries(ticketData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value.length !== 0) {
                    if(key === 'tags' && Array.isArray(value)) {
                        value.forEach((tag) => {
                            formData.append(`ticket[${key}][]`, tag);
                        });
                    } else {
                        formData.append(`ticket[${key}]`, value);
                    }
                }
            });

            if (attachments && attachments.length > 0) {
                attachments.forEach((file, index) => {
                    formData.append(`attachments[${index}]`, file);
                });
            }

            const response = await axios.post(`${API_URL}/api/tickets`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error in createTicket service:", error);
            throw handleApiError(error);
        }
    },

    updateTicket: async (id, ticketData) => {
        try {
            const response = await axios.put(`${API_URL}/api/tickets/${id}`, { ticket: ticketData }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error updating ticket:", error);
            throw handleApiError(error);
        }
    },

    deleteTicket: async (id) => {
        try {
            await axios.delete(`${API_URL}/api/tickets/${id}`, { withCredentials: true });
            return { success: true };
        } catch (error) {
            console.error("Error deleting ticket:", error);
            throw handleApiError(error);
        }
    },

    getTicketFields: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/fields`, { withCredentials: true });
            return response.data.fields;
        } catch (error) {
            console.error("Error fetching ticket fields:", error);
            throw handleApiError(error);
        }
    },

    getTicketCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/count`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching ticket count:", error);
            throw handleApiError(error);
        }
    },

    mergeTickets: async (primaryTicketId, secondaryTicketIds) => {
        try {
            const response = await axios.put(
            `${API_URL}/api/tickets/${primaryTicketId}/merge`,
            { ticket_ids: secondaryTicketIds },
            { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error("Error merging tickets:", error);
            throw handleApiError(error);
        }
    },

    exportTickets: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/export`, {
                responseType: 'blob',
                withCredentials: true
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tickets_${new Date().toISOString()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting tickets:", error);
            throw handleApiError(error);
        }
    }
};

export default ticketService;
