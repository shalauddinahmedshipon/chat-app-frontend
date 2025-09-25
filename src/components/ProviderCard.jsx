import { useNavigate } from "react-router-dom";

export default function ProviderCard({ provider }) {
  const navigate = useNavigate();

  const handleMessage = () => {
    // Navigate to chat page with this provider
    navigate(`/chat?providerId=${provider.id}`);
  };

  return (
    <div className="border rounded-lg shadow-md p-4 flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">{provider.name}</h3>
        <p className="text-gray-600">{provider.email}</p>
        <p className="text-sm text-gray-500">{provider.phone}</p>
      </div>
      <button
        onClick={handleMessage}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Message
      </button>
    </div>
  );
}
