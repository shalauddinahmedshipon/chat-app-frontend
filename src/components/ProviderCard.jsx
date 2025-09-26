import { useNavigate } from "react-router-dom";
import useUserStore from "../store/userStore";
import useChatStore from "../store/chatStore";
import { useEffect, useMemo } from "react";

export default function ProviderCard({ provider }) {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { conversations,loadingConversations, setActiveConversation,fetchConversations} = useChatStore();

  const existingConv = useMemo(() => {
  return conversations.find(
    (c) => c.providerId === provider.user.id || c.provider?.id === provider.user.id
  );
}, [conversations, provider.user.id]);

console.log("existingConv",existingConv)
const handleMessage = () => {
  if (!user) return;

  let conv = existingConv;
  if (!conv) {
    const virtualId = `virtual_${provider.user.id}_${Date.now()}`;
   conv = {
  id: virtualId,
  providerId: provider.user.id,
  userId: user.id,
  user: {
    id: user.id,
    name: user.name, // ✅ include name
    email: user.email,
  },
  provider: {
    id: provider.user.id,
    providerProfile: {
      bussinessName: provider.bussinessName,
    },

  },
  messages: [],
  unreadCount: 0,
};

    setActiveConversation(conv, true);
  } else {
    setActiveConversation(conv);
  }

  navigate(`/chat?conversationId=${conv.id}&providerId=${provider.user.id}&providerName=${provider.bussinessName}`);
};

useEffect(() => {
  const fetchData = async () => {
    await fetchConversations();
  };
  fetchData();
}, []);

const isConversationsLoaded = !loadingConversations && conversations?.length >= 0;

  return (
    <div className="border rounded-lg shadow-md p-4 flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">{provider.bussinessName}</h3>
        <p className="text-gray-600">{provider.email}</p>
        <p className="text-sm text-gray-500">{provider.phone}</p>
      </div>
    
<button
  onClick={handleMessage}
  disabled={!isConversationsLoaded}
  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
>
  Message
</button>
    </div>
  );
}
