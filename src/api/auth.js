import api from "./axios";

export const loginApi = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  console.log(res.data)
  return res.data
};
