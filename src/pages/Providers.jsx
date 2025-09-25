import { useEffect } from "react";
import useProviderStore from "../store/providerStore";
import ProviderCard from "../components/ProviderCard";
import { useNavigate } from "react-router-dom";

export default function Providers() {
  const { providers, fetchProviders, loading } = useProviderStore();
  const navigate = useNavigate();

  const handleMessage = () => {
    // Navigate to chat page with this provider
    navigate(`/chat`);
  };
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  console.log(providers)
  if (loading) return <p className="text-center mt-10">Loading providers...</p>;

  return (
    <div className="p-6">
      <button onClick={handleMessage}>Chats</button>
      <h2 className="text-2xl font-bold mb-4">All Providers</h2>
      <div className="grid gap-4">
        {providers?.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}
