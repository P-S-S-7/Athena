import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const contactService = {
    getContacts: async () => {
        const response = await axios.get(`${API_URL}/api/contacts`, { withCredentials: true });
        return response.data.contacts;
    },
};

export default contactService;
