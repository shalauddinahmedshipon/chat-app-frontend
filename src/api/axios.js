import axios from "axios";
import useUserStore from "../store/userStore";

const api = axios.create({
  baseURL:import.meta.env.VITE_BASE_URL, 
});

// attach token to every request
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
