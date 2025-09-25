import { create } from "zustand";
import { fetchProvidersApi } from "../api/provider";


const useProviderStore = create((set) => ({
  providers: [],
  loading: false,
  fetchProviders: async () => {
    set({ loading: true });
    try {
      const res = await fetchProvidersApi();
      set({ providers: res.data.data, loading: false }); // ✅ only array
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },
}));

export default useProviderStore;
