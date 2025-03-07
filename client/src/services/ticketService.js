import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ticketService = {
    getTickets: async (orderBy = 'created_at', orderType = 'desc') => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets`, {
                params: { order_by: orderBy, order_type: orderType },
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching tickets:", error);
        }
    },

    getTicket: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching ticket:", error);
            throw error;
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
            throw error;
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
          throw error;
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
          throw error;
        }
    },

    deleteConversation:async (conversationId) => {
        try {
          const response = await axios.delete(
            `${API_URL}/api/conversations/${conversationId}`,
            { withCredentials: true }
          );
          return response.data;
        } catch (error) {
          console.error("Error deleting conversation:", error);
          throw error;
        }
      },

      updateConversation:async (conversationId, formData) => {
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
            throw error;
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
            throw error;
          }
    },

    createTicket: async (ticketData, attachments = []) => {
        try {
            const formData = new FormData();

            Object.entries(ticketData).forEach(([key, value]) => {
                if (value !== null && value !== undefined &&
                    !(Array.isArray(value) && value.length === 0)) {

                    if (key === 'tags' && Array.isArray(value)) {
                        formData.append(`ticket[${key}]`, JSON.stringify(value));
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
            throw error;
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
            throw error;
        }
    },

    deleteTicket: async (id) => {
        try {
            await axios.delete(`${API_URL}/api/tickets/${id}`, { withCredentials: true });
            return { success: true };
        } catch (error) {
            console.error("Error deleting ticket:", error);
            throw error;
        }
    },

    getTicketFields: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/fields`, { withCredentials: true });
            return response.data.fields;
        } catch (error) {
            console.error("Error fetching ticket fields:", error);
            return [];
        }
    },

    filterTickets: (tickets, filterParams) => {
        if (!filterParams || Object.keys(filterParams).length === 0) {
            return tickets;
        }

        return tickets.filter(ticket => {
            if (filterParams.created_after) {
                const ticketDate = new Date(ticket.created_at);
                const filterDate = new Date(filterParams.created_after);
                if (ticketDate < filterDate) return false;
            }

            if (filterParams.created_before) {
                const ticketDate = new Date(ticket.created_at);
                const filterDate = new Date(filterParams.created_before);
                if (ticketDate > filterDate) return false;
            }

            if (filterParams.status !== undefined) {
                if (Array.isArray(filterParams.status)) {
                    if (filterParams.status.length > 0 && !filterParams.status.includes(ticket.status)) {
                        return false;
                    }
                } else if (filterParams.status !== "" && ticket.status != filterParams.status) {
                    return false;
                }
            }

            if (filterParams.priority !== undefined) {
                if (Array.isArray(filterParams.priority)) {
                    if (filterParams.priority.length > 0 && !filterParams.priority.includes(ticket.priority)) {
                        return false;
                    }
                } else if (filterParams.priority !== "" && ticket.priority != filterParams.priority) {
                    return false;
                }
            }

            if (filterParams.source !== undefined) {
                console.log(filterParams.source);
                console.log(ticket.source);
                if (Array.isArray(filterParams.source)) {
                    if (filterParams.source.length > 0 && !filterParams.source.includes(ticket.source)) {
                        return false;
                    }
                } else if (filterParams.source !== "" && ticket.source != filterParams.source) {
                    return false;
                }
            }

            if (filterParams.agent !== undefined) {
                if (Array.isArray(filterParams.agent)) {
                    if (filterParams.agent.length > 0 && !filterParams.agent.includes(ticket.responder_id)) {
                        return false;
                    }
                } else if (filterParams.agent !== "" && ticket.responder_id != filterParams.agent) {
                    return false;
                }
            }

            if (filterParams.group !== undefined) {
                if (Array.isArray(filterParams.group)) {
                    if (filterParams.group.length > 0 && !filterParams.group.includes(ticket.group_id)) {
                        return false;
                    }
                } else if (filterParams.group !== "" && ticket.group_id != filterParams.group) {
                    return false;
                }
            }

            if (filterParams.ticket_type !== undefined) {
                if (Array.isArray(filterParams.ticket_type)) {
                    if (filterParams.ticket_type.length > 0 && !filterParams.ticket_type.includes(ticket.type)) {
                        return false;
                    }
                } else if (filterParams.ticket_type !== "" && ticket.type !== filterParams.ticket_type) {
                    return false;
                }
            }

            for (const key in filterParams) {
                if (key.startsWith('cf_') && filterParams[key] !== "") {
                    if (!ticket.custom_fields || ticket.custom_fields[key] === undefined) {
                        return false;
                    }

                    if (Array.isArray(filterParams[key])) {
                        if (filterParams[key].length > 0 && !filterParams[key].includes(ticket.custom_fields[key])) {
                            return false;
                        }
                    } else if (ticket.custom_fields[key] !== filterParams[key]) {
                        return false;
                    }
                }
            }

            return true;
        });
    },

    getTicketCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tickets/count`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching ticket count:", error);
        }
    }
};

export default ticketService;
