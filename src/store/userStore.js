import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { loginApi } from "../api/auth";

const useUserStore = create((set) => ({
  user: null,
  token: localStorage.getItem("accessToken") || null,

  login: async (email, password) => {
    const res = await loginApi(email, password);
    const { user, access_token, refresh_token } = res.data;

    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);

    set({ user, token: access_token });

    return user;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, token: null });
  },

  initializeUser: () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token); // ✅ fixed
        set({
          user: { id: decoded.id, email: decoded.email, role: decoded.role },
          token,
        });
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, token: null });
      }
    }
  },
}));

export default useUserStore;
