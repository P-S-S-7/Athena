import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL;

const cannedResponseService = {
    getFolders: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/canned_response_folders`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching canned response folders:", error);
            throw handleApiError(error);
        }
    },

    getFolderResponses: async (folderId) => {
        try {
            const response = await axios.get(`${API_URL}/api/canned_response_folders/${folderId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching responses for folder ${folderId}:`, error);
            throw handleApiError(error);
        }
    },

    getResponse: async (responseId) => {
        try {
            const response = await axios.get(`${API_URL}/api/canned_responses/${responseId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching canned response ${responseId}:`, error);
            throw handleApiError(error);
        }
    }
};

export default cannedResponseService;
