import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const groupService = {
    getGroups: async () => {
        const response = await axios.get(`${API_URL}/api/groups`, { withCredentials: true });
        return response.data.groups;
    },
    getGroupAgents: async (groupId) => {
        const response = await axios.get(`${API_URL}/api/groups/${groupId}`, { withCredentials: true });
        return response.data.group;
    }
};

export default groupService;
