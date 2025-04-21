import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL;

const contactService = {
    getContacts: async (orderBy = 'name', orderType = 'asc', page = 1, perPage = 50, filters = {}) => {
        try {
            const params = {
                order_by: orderBy,
                order_type: orderType,
                page: page,
                per_page: perPage,
                ...filters
            };

            const response = await axios.get(`${API_URL}/api/contacts`, {
                params: params,
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
            if (error.response && error.response.status === 422) {
                console.error("Validation error:", error.response.data);
                throw new Error(JSON.stringify(error.response.data));
            }
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
            if (error.response && error.response.status === 422) {
                console.error("Validation error:", error.response.data);
                throw new Error(JSON.stringify(error.response.data));
            }
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

    exportContacts: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/contacts/export`, {
                withCredentials: true,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contacts_${new Date().toISOString()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting contacts:", error);
            throw handleApiError(error);
        }
    }
};

export default contactService;
