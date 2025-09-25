import api from "./axios";

export const fetchProvidersApi = async () => {
  const res = await api.get("/user/providers"); 
  // adjust if your backend endpoint is different
  return res.data;
};
