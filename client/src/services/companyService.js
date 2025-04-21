import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL;

const companyService = {
    getCompanies: async (orderBy = 'name', orderType = 'asc', page = 1, perPage = 50) => {
        try {
            const response = await axios.get(`${API_URL}/api/companies`, {
                params: {
                    order_by: orderBy,
                    order_type: orderType,
                    page: page,
                    per_page: perPage
                },
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching companies:", error);
            throw handleApiError(error);
        }
    },

    getCompany: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/api/companies/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching company:", error);
            throw handleApiError(error);
        }
    },

    createCompany: async (companyData) => {
        try {
            const response = await axios.post(`${API_URL}/api/companies`, { company: companyData }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 422) {
                console.error("Validation error:", error.response.data);
                throw new Error(JSON.stringify(error.response.data));
            }
            console.error("Error creating company:", error);
            throw handleApiError(error);
        }
    },

    updateCompany: async (id, companyData) => {
        try {
            const response = await axios.put(`${API_URL}/api/companies/${id}`, { company: companyData }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 422) {
                console.error("Validation error:", error.response.data);
                throw new Error(JSON.stringify(error.response.data));
            }
            console.error("Error updating company:", error);
            throw handleApiError(error);
        }
    },

    deleteCompany: async (id) => {
        try {
            await axios.delete(`${API_URL}/api/companies/${id}`, { withCredentials: true });
            return { success: true };
        } catch (error) {
            console.error("Error deleting company:", error);
            throw handleApiError(error);
        }
    },

    getCompanyFields: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/companies/fields`, { withCredentials: true });
            return response.data.fields;
        } catch (error) {
            console.error("Error fetching company fields:", error);
            throw handleApiError(error);
        }
    }
};

export default companyService;
