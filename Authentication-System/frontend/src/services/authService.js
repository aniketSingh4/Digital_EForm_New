import api from "./api";

const authService = {

    register: async (userData) => {

        const response = await api.post("/auth/register", userData);

        return response.data;
    },

    login: async (loginData) => {

        const response = await api.post("/auth/login", loginData);

        return response.data;
    }

};

export default authService;