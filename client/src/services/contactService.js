import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL;

const contactService = {
    getContacts: async (orderBy = 'created_at', orderType = 'desc') => {
        try {
            const response = await axios.get(`${API_URL}/api/contacts`, {
                params: { order_by: orderBy, order_type: orderType },
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching contacts:", error);
            throw handleApiError(error);
        }
    },

    getContact: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/api/contacts/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching contact:", error);
            throw handleApiError(error);
        }
    },

    createContact: async (contactData, avatar = null) => {
        try {
            const formData = new FormData();

            Object.entries(contactData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            formData.append(`contact[${key}]`, JSON.stringify(value));
                        }
                    }
                    else if (typeof value === 'object' && !Array.isArray(value)) {
                        formData.append(`contact[${key}]`, JSON.stringify(value));
                    }
                    else if (typeof value === 'string') {
                        if (value.trim() !== '') {
                            formData.append(`contact[${key}]`, value);
                        }
                    }
                    else {
                        formData.append(`contact[${key}]`, value);
                    }
                }
            });

            if (avatar) {
                formData.append('avatar', avatar);
            }

            const response = await axios.post(`${API_URL}/api/contacts`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error creating contact:", error);
            throw handleApiError(error);
        }
    },

    updateContact: async (id, contactData, avatar = null) => {
        try {
            const formData = new FormData();

            Object.entries(contactData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            formData.append(`contact[${key}]`, JSON.stringify(value));
                        }
                    }
                    else if (typeof value === 'object' && !Array.isArray(value)) {
                        formData.append(`contact[${key}]`, JSON.stringify(value));
                    }
                    else if (typeof value === 'string') {
                        if (value.trim() !== '') {
                            formData.append(`contact[${key}]`, value);
                        }
                    }
                    else {
                        formData.append(`contact[${key}]`, value);
                    }
                }
            });

            if (avatar) {
                formData.append('avatar', avatar);
            }

            const response = await axios.put(`${API_URL}/api/contacts/${id}`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Error updating contact:", error);
            throw handleApiError(error);
        }
    },

    deleteContact: async (id) => {
        try {
            await axios.delete(`${API_URL}/api/contacts/${id}`, { withCredentials: true });
            return { success: true };
        } catch (error) {
            console.error("Error deleting contact:", error);
            throw handleApiError(error);
        }
    },

    getContactFields: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/contacts/fields`, { withCredentials: true });
            return response.data.fields;
        } catch (error) {
            console.error("Error fetching contact fields:", error);
            throw handleApiError(error);
        }
    },

    mergeContacts: async (primaryId, secondaryIds, contactData = {}) => {
        console.log('Primary ID:', primaryId);
        console.log('Secondary IDs:', secondaryIds);
        console.log('Contact data:', contactData);
        try {
            const payload = {
                primary_contact_id: primaryId,
                secondary_contact_ids: secondaryIds
            };

            if (Object.keys(contactData).length > 0) {
                payload.contact = contactData;
            }

            const response = await axios.post(`${API_URL}/api/contacts/merge`, payload, {
            withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error merging contacts:", error);
            throw handleApiError(error);
        }
    },

    getContactCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/contacts/count`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching contact count:", error);
            throw handleApiError(error);
        }
    },

    getCompanies: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/contacts/companies`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching companies:", error);
            throw handleApiError(error);
        }
    },

    filterContacts: (contacts, filterParams) => {
        if (!filterParams || Object.keys(filterParams).length === 0) {
            return contacts;
        }

        return contacts.filter(contact => {
            if (filterParams.created_after) {
                const contactDate = new Date(contact.created_at);
                const filterDate = new Date(filterParams.created_after);
                if (contactDate < filterDate) return false;
            }

            if (filterParams.created_before) {
                const contactDate = new Date(contact.created_at);
                const filterDate = new Date(filterParams.created_before);
                if (contactDate > filterDate) return false;
            }

            if (filterParams.updated_after) {
                const contactDate = new Date(contact.updated_at);
                const filterDate = new Date(filterParams.updated_after);
                if (contactDate < filterDate) return false;
            }

            if (filterParams.updated_before) {
                const contactDate = new Date(contact.updated_at);
                const filterDate = new Date(filterParams.updated_before);
                if (contactDate > filterDate) return false;
            }

            if (filterParams.job_title && !contact.job_title?.toLowerCase().includes(filterParams.job_title.toLowerCase())) {
                return false;
            }

            return true;
        });
    }
};

export default contactService;
