import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL;

const syncService = {
  syncAll: async () => {
    try {
      const response = await axios.post(`${API_URL}/api/sync/sync_all`, {}, {
        withCredentials: true
      });
      console.log("Sync successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error syncing data:", error);
      throw handleApiError(error);
    }
  }
};

export default syncService;
