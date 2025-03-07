import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const agentService = {
    getAgents: async () => {
        const response = await axios.get(`${API_URL}/api/agents`, { withCredentials: true });
        return response.data.agents;
    },
};

export default agentService;
