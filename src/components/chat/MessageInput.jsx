import { useState } from "react";
import useChatStore from "../../store/chatStore";

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const sendMessage = useChatStore((state) => state.sendMessage);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Pass conversationId and text
    await sendMessage(conversationId, text, null);

    setText("");
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 border rounded px-3 py-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
      >
        Send
      </button>
    </form>
  );
}
